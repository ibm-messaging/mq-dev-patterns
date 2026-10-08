#  Copyright 2022, 2026 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the 'License');
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  http://www.apache.org/licenses/LICENSE-2.0
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

import os
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2             as ec2,
    aws_ecs             as ecs,
    aws_efs             as efs,
    aws_logs            as logs,
    aws_ecr_assets      as ecr_assets,
    aws_secretsmanager  as secretsmanager,
    aws_elasticloadbalancingv2      as elbv2,
)
from constructs import Construct


class MqShowcaseStack(cdk.Stack):

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        app_password: str,
        admin_password: str,
        mq_config: dict,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self._cfg             = mq_config
        secrets               = self._create_secrets(app_password, admin_password)
        vpc                   = self._lookup_vpc()
        cluster, task_sg, \
        nlb_sg                = self._create_cluster_and_sg(vpc)
        file_system           = self._create_efs(vpc, task_sg)
        log_group             = self._create_log_group()
        frontend_image, \
        backend_image         = self._build_images()
        task_def              = self._create_task_definition(secrets, file_system, log_group,
                                                             frontend_image, backend_image)
        nlb                   = self._create_nlb(vpc, nlb_sg)
        service               = self._create_service(cluster, task_def, task_sg)
        self._attach_nlb(nlb, service, vpc)
        self._wait_for_efs_mounts(service, file_system)
        self._add_outputs(nlb)

    #Secrets Manager
    def _create_secrets(self, app_password: str, admin_password: str) -> dict:
        """Store MQ passwords in Secrets Manager.
        ECS injects them at task start — never stored as plaintext env vars."""
        sec = self._cfg['secrets']
        app_secret = secretsmanager.Secret(
            self, 'MqAppSecret',
            secret_name=sec['appPasswordName'],
            secret_string_value=cdk.SecretValue.unsafe_plain_text(app_password),
            description='IBM MQ app user password',
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )
        admin_secret = secretsmanager.Secret(
            self, 'MqAdminSecret',
            secret_name=sec['adminPasswordName'],
            secret_string_value=cdk.SecretValue.unsafe_plain_text(admin_password),
            description='IBM MQ admin user password',
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )
        return {'app': app_secret, 'admin': admin_secret}

    #VPC
    def _lookup_vpc(self) -> ec2.IVpc:
        """Use the default VPC — no VPC creation required."""
        return ec2.Vpc.from_lookup(self, 'DefaultVpc', is_default=True)

    #ECS Cluster + Security Groups
    def _create_cluster_and_sg(self, vpc: ec2.IVpc):
        """Create the ECS cluster, a task security group (locked to NLB), and
        an NLB security group (open to world on app ports)."""
        cluster = ecs.Cluster(
            self, 'MqCluster',
            cluster_name=self._cfg['cluster']['name'],
            vpc=vpc,
        )
        #NLB SG — accepts inbound traffic from the internet on app ports
        nlb_sg = ec2.SecurityGroup(
            self, 'MqNlbSg',
            vpc=vpc,
            security_group_name='mqonaws-nlb-sg',
            description='MQ on AWS NLB - inbound from internet',
            allow_all_outbound=True,
        )
        nlb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80),   'Frontend HTTP')
        nlb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(9443), 'MQ Console HTTPS')
        task_sg = ec2.SecurityGroup(
            self, 'MqTaskSg',
            vpc=vpc,
            security_group_name='mqonaws-task-sg',
            description='MQ on AWS task - accept only from NLB and EFS',
            allow_all_outbound=False,
        )
        # Inbound: only from NLB SG
        task_sg.add_ingress_rule(ec2.Peer.security_group_id(nlb_sg.security_group_id),
                                 ec2.Port.tcp(3000), 'Frontend from NLB')
        task_sg.add_ingress_rule(ec2.Peer.security_group_id(nlb_sg.security_group_id),
                                 ec2.Port.tcp(9443), 'MQ Console from NLB')
        task_sg.add_ingress_rule(ec2.Peer.security_group_id(nlb_sg.security_group_id),
                                 ec2.Port.tcp(1414), 'MQ MQI from NLB')
        task_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(2049), 'EFS NFS')
        # Outbound: HTTPS for Secrets Manager + ECR, HTTP for ECR auth token,
        # NFS for EFS, and DNS
        task_sg.add_egress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(443),  'HTTPS outbound (Secrets Manager, ECR)')
        task_sg.add_egress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80),   'HTTP outbound (ECR auth)')
        task_sg.add_egress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(2049), 'EFS NFS outbound')
        task_sg.add_egress_rule(ec2.Peer.any_ipv4(), ec2.Port.udp(53),   'DNS outbound')
        task_sg.add_egress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(53),   'DNS outbound TCP')

        return cluster, task_sg, nlb_sg

    #EFS Filesystem
    def _create_efs(self, vpc: ec2.IVpc, sg: ec2.SecurityGroup) -> efs.FileSystem:
        """Create EFS for persistent MQ queue manager storage.
        Mount targets are placed in public subnets — same subnets as Fargate tasks."""
        file_system = efs.FileSystem(
            self, 'MqEfs',
            vpc=vpc,
            file_system_name=self._cfg['efs']['name'],
            security_group=sg,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
        )
        # Access point grants the MQ container (uid 1001, gid 0) write access.
        file_system.add_access_point(
            'MqAccessPoint',
            path='/mqm',
            posix_user=efs.PosixUser(uid='1001', gid='0'),
            create_acl=efs.Acl(
                owner_uid='1001',
                owner_gid='0',
                permissions='0770',
            ),
        )
        return file_system

    #CloudWatch Log Group
    def _create_log_group(self) -> logs.LogGroup:
        """Single log group for all three containers, retained for one week."""
        return logs.LogGroup(
            self, 'MqLogGroup',
            log_group_name=self._cfg['logs']['groupName'],
            removal_policy=cdk.RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK,
        )

    #Container Images
    def _build_images(self):
        """Build frontend and backend images from local Dockerfiles.
        CDK pushes them to a managed ECR repository automatically."""
        root_dir = os.path.join(os.path.dirname(__file__), '..')
        frontend_image = ecr_assets.DockerImageAsset(
            self, 'FrontendImage',
            directory=os.path.join(root_dir, 'frontend'),
            platform=ecr_assets.Platform.LINUX_AMD64,
        )
        backend_image = ecr_assets.DockerImageAsset(
            self, 'BackendImage',
            directory=os.path.join(root_dir, 'backend'),
            platform=ecr_assets.Platform.LINUX_AMD64,
        )
        return frontend_image, backend_image

    #Fargate Task Definition
    def _create_task_definition(
        self,
        secrets: dict,
        file_system: efs.FileSystem,
        log_group: logs.LogGroup,
        frontend_image: ecr_assets.DockerImageAsset,
        backend_image: ecr_assets.DockerImageAsset,
    ) -> ecs.FargateTaskDefinition:
        """Define the Fargate task with three containers: mq, be, fe.
        Container startup order: mq -> be -> fe."""
        task_def = ecs.FargateTaskDefinition(
            self, 'MqTaskDef',
            family=self._cfg['task']['family'],
            cpu=self._cfg['task']['cpu'],
            memory_limit_mib=self._cfg['task']['memoryMiB'],
        )

        # Mount EFS into the task
        task_def.add_volume(
            name='qm1data',
            efs_volume_configuration=ecs.EfsVolumeConfiguration(
                file_system_id=file_system.file_system_id,
                transit_encryption='ENABLED',
                authorization_config=ecs.AuthorizationConfig(
                    access_point_id=file_system.node.find_child('MqAccessPoint').access_point_id,
                    iam='ENABLED',
                ),
            ),
        )

        # Grant the task role EFS access and the execution role Secrets Manager access
        file_system.grant_root_access(task_def.task_role)
        secrets['app'].grant_read(task_def.obtain_execution_role())
        secrets['admin'].grant_read(task_def.obtain_execution_role())

        mq_container = self._add_mq_container(task_def, secrets, log_group)
        be_container = self._add_backend_container(task_def, secrets, backend_image, log_group, mq_container)
        self._add_frontend_container(task_def, frontend_image, log_group, be_container)

        return task_def

    #MQ Container
    def _add_mq_container(
        self,
        task_def: ecs.FargateTaskDefinition,
        secrets: dict,
        log_group: logs.LogGroup,
    ) -> ecs.ContainerDefinition:
        """IBM MQ queue manager container. Passwords injected from Secrets Manager."""
        mq_cfg = self._cfg['mq']
        mq_container = task_def.add_container(
            'mq',
            image=ecs.ContainerImage.from_registry(mq_cfg['image']),
            cpu=mq_cfg['cpu'],
            memory_limit_mib=mq_cfg['memoryMiB'],
            essential=True,
            environment={
                'LICENSE':      'accept',
                'MQ_QMGR_NAME': mq_cfg['qmgrName'],
            },
            secrets={
                'MQ_APP_PASSWORD':   ecs.Secret.from_secrets_manager(secrets['app']),
                'MQ_ADMIN_PASSWORD': ecs.Secret.from_secrets_manager(secrets['admin']),
            },
            port_mappings=[
                ecs.PortMapping(container_port=mq_cfg['ports']['mqi'],     protocol=ecs.Protocol.TCP),
                ecs.PortMapping(container_port=mq_cfg['ports']['console'], protocol=ecs.Protocol.TCP),
            ],
            logging=ecs.LogDrivers.aws_logs(stream_prefix='mq', log_group=log_group),
        )
        mq_container.add_mount_points(
            ecs.MountPoint(
                source_volume='qm1data',
                container_path='/mnt/mqm',
                read_only=False,
            )
        )
        return mq_container

    #Backend Container
    def _add_backend_container(
        self,
        task_def: ecs.FargateTaskDefinition,
        secrets: dict,
        backend_image: ecr_assets.DockerImageAsset,
        log_group: logs.LogGroup,
        mq_container: ecs.ContainerDefinition,
    ) -> ecs.ContainerDefinition:
        """Node.js backend — waits for MQ to start before launching."""
        be_cfg = self._cfg['backend']
        mq_cfg = self._cfg['mq']
        be_container = task_def.add_container(
            'be',
            image=ecs.ContainerImage.from_docker_image_asset(backend_image),
            cpu=be_cfg['cpu'],
            memory_limit_mib=be_cfg['memoryMiB'],
            essential=True,
            environment={
                'HOST':              'localhost',
                'MQ_QMGR_PORT_MQI': str(mq_cfg['ports']['mqi']),
                'MQ_QMGR_PORT_API': str(mq_cfg['ports']['console']),
            },
            secrets={
                'APP_PASSWORD':   ecs.Secret.from_secrets_manager(secrets['app']),
                'ADMIN_PASSWORD': ecs.Secret.from_secrets_manager(secrets['admin']),
            },
            port_mappings=[
                ecs.PortMapping(container_port=be_cfg['port'], protocol=ecs.Protocol.TCP),
            ],
            logging=ecs.LogDrivers.aws_logs(stream_prefix='be', log_group=log_group),
        )
        be_container.add_container_dependencies(
            ecs.ContainerDependency(
                container=mq_container,
                condition=ecs.ContainerDependencyCondition.START,
            )
        )
        return be_container

    #Frontend Container
    def _add_frontend_container(
        self,
        task_def: ecs.FargateTaskDefinition,
        frontend_image: ecr_assets.DockerImageAsset,
        log_group: logs.LogGroup,
        be_container: ecs.ContainerDefinition,
    ) -> None:
        """React/nginx frontend — waits for backend to start before launching."""
        fe_cfg = self._cfg['frontend']
        be_cfg = self._cfg['backend']
        fe_container = task_def.add_container(
            'fe',
            image=ecs.ContainerImage.from_docker_image_asset(frontend_image),
            cpu=fe_cfg['cpu'],
            memory_limit_mib=fe_cfg['memoryMiB'],
            essential=True,
            environment={
                # In ECS Fargate (awsvpc mode) all containers in a task share
                # the same network namespace — the backend is reachable at localhost.
                'REACT_APP_BE_HOST':                 'localhost',
                'REACT_APP_BE_PORT':                 str(be_cfg['port']),
                'REACT_APP_BE_TLS':                  'false',
                # FE_AS_PROXY=true makes nginx proxy /api/* requests to the backend
                # rather than issuing a client-side redirect — required in ECS because
                # the browser cannot reach the backend directly.
                'REACT_APP_FE_AS_PROXY':             'true',
                'REACT_APP_IS_FOR_CODING_CHALLENGE': 'false',
            },
            port_mappings=[
                ecs.PortMapping(container_port=fe_cfg['port'], protocol=ecs.Protocol.TCP),
            ],
            logging=ecs.LogDrivers.aws_logs(stream_prefix='fe', log_group=log_group),
        )
        fe_container.add_container_dependencies(
            ecs.ContainerDependency(
                container=be_container,
                condition=ecs.ContainerDependencyCondition.START,
            )
        )

    #NLB
    def _create_nlb(self, vpc: ec2.IVpc, nlb_sg: ec2.SecurityGroup) -> elbv2.NetworkLoadBalancer:
        """Internet-facing NLB. TCP passthrough preserves MQ's own TLS on 9443."""
        return elbv2.NetworkLoadBalancer(
            self, 'MqNlb',
            vpc=vpc,
            internet_facing=True,
            security_groups=[nlb_sg],
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

    def _attach_nlb(
        self,
        nlb: elbv2.NetworkLoadBalancer,
        service: ecs.FargateService,
        vpc: ec2.IVpc,
    ) -> None:
        """Wire NLB listeners to the Fargate service on ports 80 and 9443."""
        fe_cfg  = self._cfg['frontend']
        mq_cfg  = self._cfg['mq']

        # NLB port 80 → frontend container port 3000
        fe_tg = elbv2.NetworkTargetGroup(
            self, 'FeTg',
            vpc=vpc,
            port=fe_cfg['port'],          # target group port = container port (3000)
            protocol=elbv2.Protocol.TCP,
            targets=[service.load_balancer_target(
                container_name='fe',
                container_port=fe_cfg['port'],
            )],
            health_check=elbv2.HealthCheck(protocol=elbv2.Protocol.TCP),
        )
        nlb.add_listener('FeListener', port=80, protocol=elbv2.Protocol.TCP,
                         default_target_groups=[fe_tg])

        mq_tg = elbv2.NetworkTargetGroup(
            self, 'MqConsoleTg',
            vpc=vpc,
            port=mq_cfg['ports']['console'],
            protocol=elbv2.Protocol.TCP,
            targets=[service.load_balancer_target(
                container_name='mq',
                container_port=mq_cfg['ports']['console'],
            )],
            health_check=elbv2.HealthCheck(protocol=elbv2.Protocol.TCP),
        )
        nlb.add_listener('MqConsoleListener', port=9443, protocol=elbv2.Protocol.TCP,
                         default_target_groups=[mq_tg])

    #Fargate Service
    def _create_service(
        self,
        cluster: ecs.Cluster,
        task_def: ecs.FargateTaskDefinition,
        task_sg: ec2.SecurityGroup,
    ) -> ecs.FargateService:
        """Single Fargate service. Public IP needed for outbound AWS API access
        (Secrets Manager, ECR). Inbound traffic locked to the NLB SG."""
        service = ecs.FargateService(
            self, 'MqService',
            service_name=self._cfg['service']['name'],
            cluster=cluster,
            task_definition=task_def,
            desired_count=1,
            assign_public_ip=True,
            security_groups=[task_sg],
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            # circuit_breaker stops a bad deployment within minutes instead of
            # waiting up to 3 hours for ECS to time out.
            circuit_breaker=ecs.DeploymentCircuitBreaker(rollback=True),
            # min_healthy_percent=0 allows the old task to stop before the new
            # one starts — required because MQ places an exclusive lock on EFS.
            min_healthy_percent=0,
            max_healthy_percent=100,
        )
        return service

    #EFS mount target dependency
    def _wait_for_efs_mounts(
        self,
        service: ecs.FargateService,
        file_system: efs.FileSystem,
    ) -> None:
        """Force CloudFormation to wait for ALL EFS mount targets to be fully
        available before creating the ECS service. Without this the first Fargate
        task fails with an EFS DNS resolution error."""
        cfn_service = service.node.default_child
        for child in file_system.node.find_all():
            if isinstance(child, efs.CfnMountTarget):
                cfn_service.add_resource_dependency(child)

    #Stack Outputs
    def _add_outputs(self, nlb: elbv2.NetworkLoadBalancer) -> None:
        """Print the stable NLB DNS name for both app endpoints."""
        cdk.CfnOutput(
            self, 'AppUrl',
            description='Messaging playground - open in your browser',
            value=f'http://{nlb.load_balancer_dns_name}',
        )
        cdk.CfnOutput(
            self, 'MqConsoleUrl',
            description='IBM MQ Web Console',
            value=f'https://{nlb.load_balancer_dns_name}:9443/ibmmq/console',
        )
        cdk.CfnOutput(
            self, 'NlbDnsName',
            description='NLB DNS name',
            value=nlb.load_balancer_dns_name,
        )
