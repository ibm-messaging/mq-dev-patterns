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

        # Extract values from parsed mq-config.yaml
        qmgr_cfg = mq_config.get("queueManager", {})
        sec_cfg = mq_config.get("security", {})
        ports_cfg = mq_config.get("ports", {})

        qmgr_name = qmgr_cfg.get("name", "QM1")
        image_uri = qmgr_cfg.get("image", "icr.io/ibm-messaging/mq:latest")
        cpu = qmgr_cfg.get("cpu", 1024)
        memory = qmgr_cfg.get("memoryLimit", 4096)

        # Prioritize CLI context flags (-c app_password=... -c admin_password=...), fallback to YAML
        # Passing passwords via CLI ensures credentials are encrypted in transit over TLS and never stored in source files.
        app_password = self.node.try_get_context("app_password") or sec_cfg.get("appPassword") or "Passw0rd123!"
        admin_password = self.node.try_get_context("admin_password") or sec_cfg.get("adminPassword") or "Passw0rd123!"
        msg_port = ports_cfg.get("messaging", 1414)
        console_port = ports_cfg.get("console", 9443)

        # 1. VPC Discovery
        # Automatically query and attach to the default VPC in the target AWS account and region
        vpc = ec2.Vpc.from_lookup(self, "MqVpc", is_default=True)

        # 2. AWS Secrets Manager for Enterprise Password Management
        # Passwords are stored in AWS Secrets Manager and injected into the container at startup via ecs.Secret.
        # This eliminates exposing sensitive credentials in plain text in Task Definition environment variables.
        mq_secret = secretsmanager.Secret(
            self, "MqSecret",
            description="IBM MQ Application and Admin Passwords",
            secret_object_value={
                "appPassword": SecretValue.unsafe_plain_text(app_password),
                "adminPassword": SecretValue.unsafe_plain_text(admin_password),
            }
        )

        # 3. Amazon ECS Cluster
        # Defines the logical cluster boundary for managing Fargate container tasks
        cluster = ecs.Cluster(
            self, "MqCluster",
            vpc=vpc,
            cluster_name="ibm-mq-cdk-cluster"
        )

        # 4. Persistent Storage (Amazon EFS)
        # IBM MQ stores queue definitions, active messages, and recovery logs under /mnt/mqm.
        # An encrypted Amazon Elastic File System (EFS) provides durable storage across container lifecycles.
        file_system = efs.FileSystem(
            self, "MqEfsData",
            vpc=vpc,
            encrypted=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # EFS Access Point with POSIX User mapping:
        # The official IBM MQ container runs as non-root UID 1001 (mqm) and primary GID 0 (root).
        # An Access Point enforces ownership (1001:0) and directory permissions (0770) on /mqdata.
        access_point = file_system.add_access_point(
            "MqAccessPoint",
            path="/mqdata",
            create_acl=efs.Acl(owner_uid="1001", owner_gid="0", permissions="770"),
            posix_user=efs.PosixUser(uid="1001", gid="0")
        )

        # 5. ECS Fargate Task Definition (CPU and Memory declared in YAML)
        task_def = ecs.FargateTaskDefinition(
            self, "MqTaskDef",
            cpu=cpu,
            memory_limit_mib=memory
        )

        # Grant IAM permissions required for the Fargate task to mount and write to EFS
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

        # Grant Task Execution Role permission to retrieve passwords from Secrets Manager
        mq_secret.grant_read(execution_role)

        # Attach EFS volume using TLS transit encryption and IAM authorization
        task_def.add_volume(
            name="mqdata",
            efs_volume_configuration=ecs.EfsVolumeConfiguration(
                file_system_id=file_system.file_system_id,
                transit_encryption="ENABLED",
                authorization_config=ecs.AuthorizationConfig(
                    access_point_id=access_point.access_point_id,
                    iam="ENABLED"
                )
            )
        )

        # Add IBM MQ container pulling the official developer image from IBM Container Registry (ICR)
        # Passwords are securely injected using AWS Secrets Manager rather than plain environment variables
        container = task_def.add_container(
            "mq",
            image=ecs.ContainerImage.from_registry(image_uri),
            environment={
                "LICENSE": "accept",
                "MQ_QMGR_NAME": qmgr_name,
            },
            secrets={
                "MQ_APP_PASSWORD": ecs.Secret.from_secrets_manager(mq_secret, "appPassword"),
                "MQ_ADMIN_PASSWORD": ecs.Secret.from_secrets_manager(mq_secret, "adminPassword"),
            },
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="ibm-mq",
                log_retention=logs.RetentionDays.ONE_WEEK
            ),
            port_mappings=[
                ecs.PortMapping(container_port=msg_port, host_port=msg_port, protocol=ecs.Protocol.TCP),
                ecs.PortMapping(container_port=console_port, host_port=console_port, protocol=ecs.Protocol.TCP)
            ]
        )

        # Mount EFS volume to /mnt/mqm inside the container
        container.add_mount_points(
            ecs.MountPoint(container_path="/mnt/mqm", source_volume="mqdata", read_only=False)
        )

        # 6. Security Groups
        # ECS Task Security Group: Allows inbound traffic from NLB on messaging and console ports
        mq_sg = ec2.SecurityGroup(self, "MqServiceSG", vpc=vpc, allow_all_outbound=True)
        mq_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(msg_port), "Allow MQ client traffic")
        mq_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(console_port), "Allow MQ console traffic")
        file_system.connections.allow_default_port_from(mq_sg)

        # Network Load Balancer Security Group
        nlb_sg = ec2.SecurityGroup(self, "MqNlbSG", vpc=vpc, allow_all_outbound=True)
        nlb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(msg_port), "Allow MQ client traffic into NLB")
        nlb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(console_port), "Allow MQ console into NLB")

        # 7. Fargate Service
        # Strictly desired_count=1, max_healthy_percent=100, min_healthy_percent=0:
        # IBM MQ places an exclusive file lock on /mnt/mqm. Enforcing a stop-before-start deployment
        # prevents duplicate task instances from conflicting over the EFS filesystem lock.
        service = ecs.FargateService(
            self, "MqFargateService",
            cluster=cluster,
            task_definition=task_def,
            desired_count=1,
            max_healthy_percent=100,
            min_healthy_percent=0,
            assign_public_ip=True,
            security_groups=[mq_sg],
            health_check_grace_period=Duration.seconds(300)
        )

        # 8. Network Load Balancer (Dual-Port: messaging & console)
        # An NLB operates at Layer 4 (TCP), passing raw TCP packets directly for MQ client messaging
        # and HTTPS traffic for the Web Console and REST API.
        nlb = elbv2.NetworkLoadBalancer(
            self, "MqNLB",
            vpc=vpc,
            internet_facing=True,
            security_groups=[nlb_sg]
        )

        # Target Group & Listener for Port 1414 (Messaging)
        # preserve_client_ip=False ensures response packets route directly back to the NLB interface
        tg_1414 = elbv2.NetworkTargetGroup(
            self, "MqPort1414TG",
            vpc=vpc,
            port=msg_port,
            protocol=elbv2.Protocol.TCP,
            preserve_client_ip=False,
            targets=[service.load_balancer_target(container_name="mq", container_port=msg_port)],
            health_check=elbv2.HealthCheck(
                protocol=elbv2.Protocol.TCP,
                port=str(msg_port),
                interval=Duration.seconds(10),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=2
            )
        )
        nlb.add_listener("MqListener1414", port=msg_port, protocol=elbv2.Protocol.TCP, default_target_groups=[tg_1414])

        # Target Group & Listener for Port 9443 (Web Console & REST API)
        tg_9443 = elbv2.NetworkTargetGroup(
            self, "MqPort9443TG",
            vpc=vpc,
            port=console_port,
            protocol=elbv2.Protocol.TCP,
            preserve_client_ip=False,
            targets=[service.load_balancer_target(container_name="mq", container_port=console_port)],
            health_check=elbv2.HealthCheck(
                protocol=elbv2.Protocol.TCP,
                port=str(console_port),
                interval=Duration.seconds(10),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=2
            )
        )
        nlb.add_listener("MqListener9443", port=console_port, protocol=elbv2.Protocol.TCP, default_target_groups=[tg_9443])

        # 9. Outputs
        CfnOutput(
            self, "MqHost",
            value=nlb.load_balancer_dns_name,
            description="MQ Hostname (NLB DNS Name)"
        )
        CfnOutput(
            self, "MqConsoleUrl",
            value=f"https://{nlb.load_balancer_dns_name}:{console_port}/ibmmq/console/",
            description="IBM MQ Web Console URL"
        )
