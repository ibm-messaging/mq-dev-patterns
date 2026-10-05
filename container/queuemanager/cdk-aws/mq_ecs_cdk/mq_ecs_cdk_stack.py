#
# Copyright 2026 IBM Corp.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    SecretValue,
    CfnOutput,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_efs as efs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_logs as logs,
    aws_iam as iam,
    aws_secretsmanager as secretsmanager,
)
from constructs import Construct


class MqEcsCdkStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, mq_config: dict, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        qmgr_cfg = mq_config.get("queueManager", {})
        sec_cfg = mq_config.get("security", {})
        ports_cfg = mq_config.get("ports", {})

        self.qmgr_name = qmgr_cfg.get("name", "QM1")
        self.image_uri = qmgr_cfg.get("image", "icr.io/ibm-messaging/mq:latest")
        self.cpu = qmgr_cfg.get("cpu", 1024)
        self.memory = qmgr_cfg.get("memoryLimit", 4096)
        self.msg_port = ports_cfg.get("messaging", 1414)
        self.console_port = ports_cfg.get("console", 9443)

        # Passwords are resolved and validated in app.py before the stack is instantiated.
        # CLI context flags take priority over mq-config.yaml values.
        self.app_password = sec_cfg.get("appPassword", "")
        self.admin_password = sec_cfg.get("adminPassword", "")
        ctx_app = self.node.try_get_context("app_password")
        ctx_admin = self.node.try_get_context("admin_password")
        if ctx_app is not None:
            self.app_password = ctx_app
        if ctx_admin is not None:
            self.admin_password = ctx_admin

        self.vpc = ec2.Vpc.from_lookup(self, "MqVpc", is_default=True)

        # Resources are created in dependency order:
        # secret and cluster have no dependencies on each other.
        # file_system and access_point must exist before _create_fargate_service
        # which internally calls _configure_task_permissions (needs self.secret),
        # _attach_efs_volume (needs self.file_system, self.access_point),
        # and _add_container (needs self.secret).
        # self.service must exist before _create_load_balancer.
        self.secret = self._create_secret()
        self.cluster = self._create_cluster()
        self.file_system, self.access_point = self._create_efs()
        self.service = self._create_fargate_service()
        self._create_load_balancer()

    def _create_secret(self):
        return secretsmanager.Secret(
            self, "MqSecret",
            description="IBM MQ app and admin passwords",
            secret_object_value={
                "appPassword": SecretValue.unsafe_plain_text(self.app_password),
                "adminPassword": SecretValue.unsafe_plain_text(self.admin_password),
            }
        )

    def _create_cluster(self):
        return ecs.Cluster(self, "MqCluster", vpc=self.vpc, cluster_name="ibm-mq-cdk-cluster")

    def _create_efs(self):
        file_system = efs.FileSystem(
            self, "MqEfsData",
            vpc=self.vpc,
            encrypted=True,
            removal_policy=RemovalPolicy.DESTROY  # WARNING: deletes all MQ queue data on cdk destroy
        )

        # MQ container runs as UID 1001 (mqm), GID 0 — enforce this via the access point
        access_point = file_system.add_access_point(
            "MqAccessPoint",
            path="/mqdata",
            create_acl=efs.Acl(owner_uid="1001", owner_gid="0", permissions="770"),
            posix_user=efs.PosixUser(uid="1001", gid="0")
        )

        return file_system, access_point

    def _create_fargate_service(self):
        task_def = ecs.FargateTaskDefinition(
            self, "MqTaskDef",
            cpu=self.cpu,
            memory_limit_mib=self.memory
        )

        self._configure_task_permissions(task_def)
        self._attach_efs_volume(task_def)
        self._add_container(task_def)

        mq_sg = ec2.SecurityGroup(self, "MqServiceSG", vpc=self.vpc, allow_all_outbound=True)
        mq_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(self.msg_port), "MQ client")
        mq_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(self.console_port), "MQ console")
        self.file_system.connections.allow_default_port_from(mq_sg)

        # MQ holds an exclusive lock on /mnt/mqm so we enforce stop-before-start rolling deploys.
        # Circuit breaker rolls back automatically if the new task fails to start.
        return ecs.FargateService(
            self, "MqFargateService",
            cluster=self.cluster,
            task_definition=task_def,
            desired_count=1,
            max_healthy_percent=100,
            min_healthy_percent=0,
            assign_public_ip=True,
            security_groups=[mq_sg],
            health_check_grace_period=Duration.seconds(300),
            circuit_breaker=ecs.DeploymentCircuitBreaker(rollback=True)
        )

    def _configure_task_permissions(self, task_def):
        efs_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "elasticfilesystem:ClientMount",
                "elasticfilesystem:ClientWrite",
                "elasticfilesystem:ClientRootAccess",
                "elasticfilesystem:DescribeMountTargets",
            ],
            resources=["*"]
        )
        task_def.task_role.add_to_principal_policy(efs_policy)

        execution_role = task_def.obtain_execution_role()
        execution_role.add_to_principal_policy(efs_policy)
        self.secret.grant_read(execution_role)

    def _attach_efs_volume(self, task_def):
        task_def.add_volume(
            name="mqdata",
            efs_volume_configuration=ecs.EfsVolumeConfiguration(
                file_system_id=self.file_system.file_system_id,
                transit_encryption="ENABLED",
                authorization_config=ecs.AuthorizationConfig(
                    access_point_id=self.access_point.access_point_id,
                    iam="ENABLED"
                )
            )
        )

    def _add_container(self, task_def):
        container = task_def.add_container(
            "mq",
            image=ecs.ContainerImage.from_registry(self.image_uri),
            environment={
                "LICENSE": "accept",
                "MQ_QMGR_NAME": self.qmgr_name,
            },
            secrets={
                "MQ_APP_PASSWORD": ecs.Secret.from_secrets_manager(self.secret, "appPassword"),
                "MQ_ADMIN_PASSWORD": ecs.Secret.from_secrets_manager(self.secret, "adminPassword"),
            },
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="ibm-mq",
                log_retention=logs.RetentionDays.ONE_WEEK
            ),
            port_mappings=[
                ecs.PortMapping(container_port=self.msg_port, host_port=self.msg_port, protocol=ecs.Protocol.TCP),
                ecs.PortMapping(container_port=self.console_port, host_port=self.console_port, protocol=ecs.Protocol.TCP)
            ]
        )

        container.add_mount_points(
            ecs.MountPoint(container_path="/mnt/mqm", source_volume="mqdata", read_only=False)
        )

    def _create_load_balancer(self):
        nlb_sg = ec2.SecurityGroup(self, "MqNlbSG", vpc=self.vpc, allow_all_outbound=True)
        nlb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(self.msg_port), "MQ client via NLB")
        nlb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(self.console_port), "MQ console via NLB")

        nlb = elbv2.NetworkLoadBalancer(
            self, "MqNLB",
            vpc=self.vpc,
            internet_facing=True,
            security_groups=[nlb_sg]
        )

        self._add_listener(nlb, self.msg_port, "MqPort1414TG", "MqListener1414")
        self._add_listener(nlb, self.console_port, "MqPort9443TG", "MqListener9443")

        CfnOutput(self, "MqHost", value=nlb.load_balancer_dns_name, description="MQ Hostname (NLB DNS Name)")
        CfnOutput(self, "MqConsoleUrl", value=f"https://{nlb.load_balancer_dns_name}:{self.console_port}/ibmmq/console/", description="IBM MQ Web Console URL")

    def _add_listener(self, nlb, port, tg_id, listener_id):
        tg = elbv2.NetworkTargetGroup(
            self, tg_id,
            vpc=self.vpc,
            port=port,
            protocol=elbv2.Protocol.TCP,
            preserve_client_ip=False,
            targets=[self.service.load_balancer_target(container_name="mq", container_port=port)],
            health_check=elbv2.HealthCheck(
                protocol=elbv2.Protocol.TCP,
                port=str(port),
                interval=Duration.seconds(10),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=2
            )
        )
        nlb.add_listener(listener_id, port=port, protocol=elbv2.Protocol.TCP, default_target_groups=[tg])
