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

resource "aws_cloudwatch_log_group" "mq" {
  name              = var.log_group_name
  retention_in_days = 7
}

resource "aws_ecs_cluster" "mq" {
  name = var.cluster_name
}

# IAM
data "aws_iam_policy_document" "ecs_tasks_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Execution role to pull images, write logs, read the two MQ secrets.
resource "aws_iam_role" "execution" {
  name               = "${var.task_family}-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "execution_secrets" {
  statement {
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.app.arn, aws_secretsmanager_secret.admin.arn]
  }
}

resource "aws_iam_role_policy" "execution_secrets" {
  name   = "read-mq-secrets"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.execution_secrets.json
}

# Task role: IAM-authorised EFS access through the access point.
resource "aws_iam_role" "task" {
  name               = "${var.task_family}-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

data "aws_iam_policy_document" "task_efs" {
  statement {
    effect = "Allow"
    actions = [
      "elasticfilesystem:ClientMount",
      "elasticfilesystem:ClientWrite",
      "elasticfilesystem:ClientRootAccess",
    ]
    resources = [aws_efs_file_system.mq.arn]
  }
}

resource "aws_iam_role_policy" "task_efs" {
  name   = "efs-access"
  role   = aws_iam_role.task.id
  policy = data.aws_iam_policy_document.task_efs.json
}

# Task definition three containers sharing one network namespace.
# Startup order is mq -> be -> fe
locals {
  log_options = { for prefix in ["mq", "be", "fe"] : prefix => {
    "awslogs-group"         = aws_cloudwatch_log_group.mq.name
    "awslogs-region"        = var.region
    "awslogs-stream-prefix" = prefix
  } }

  container_definitions = [
    {
      name      = "mq"
      image     = var.mq_image
      cpu       = var.mq_cpu
      memory    = var.mq_memory
      essential = true
      environment = [
        { name = "LICENSE", value = "accept" },
        { name = "MQ_QMGR_NAME", value = var.mq_qmgr_name },
      ]
      secrets = [
        { name = "MQ_APP_PASSWORD", valueFrom = aws_secretsmanager_secret.app.arn },
        { name = "MQ_ADMIN_PASSWORD", valueFrom = aws_secretsmanager_secret.admin.arn },
      ]
      portMappings = [
        { containerPort = var.mq_mqi_port, protocol = "tcp" },
        { containerPort = var.mq_console_port, protocol = "tcp" },
      ]
      mountPoints = [
        { sourceVolume = "qm1data", containerPath = "/mnt/mqm", readOnly = false },
      ]
      logConfiguration = { logDriver = "awslogs", options = local.log_options["mq"] }
    },
    {
      name      = "be"
      image     = local.backend_image
      cpu       = var.backend_cpu
      memory    = var.backend_memory
      essential = true
      environment = [
        { name = "HOST", value = "localhost" },
        { name = "MQ_QMGR_PORT_MQI", value = tostring(var.mq_mqi_port) },
        { name = "MQ_QMGR_PORT_API", value = tostring(var.mq_console_port) },
      ]
      secrets = [
        { name = "APP_PASSWORD", valueFrom = aws_secretsmanager_secret.app.arn },
        { name = "ADMIN_PASSWORD", valueFrom = aws_secretsmanager_secret.admin.arn },
      ]
      portMappings = [
        { containerPort = var.backend_port, protocol = "tcp" },
      ]
      dependsOn        = [{ containerName = "mq", condition = "START" }]
      logConfiguration = { logDriver = "awslogs", options = local.log_options["be"] }
    },
    {
      name      = "fe"
      image     = local.frontend_image
      cpu       = var.frontend_cpu
      memory    = var.frontend_memory
      essential = true
      environment = [
        # awsvpc: all containers in the task share a network namespace.
        { name = "REACT_APP_BE_HOST", value = "localhost" },
        { name = "REACT_APP_BE_PORT", value = tostring(var.backend_port) },
        { name = "REACT_APP_BE_TLS", value = "false" },
        # nginx proxies /api/* to the backend; the browser cannot reach it directly.
        { name = "REACT_APP_FE_AS_PROXY", value = "true" },
        { name = "REACT_APP_IS_FOR_CODING_CHALLENGE", value = var.coding_challenge },
      ]
      portMappings = [
        { containerPort = var.frontend_port, protocol = "tcp" },
      ]
      dependsOn        = [{ containerName = "be", condition = "START" }]
      logConfiguration = { logDriver = "awslogs", options = local.log_options["fe"] }
    },
  ]
}

resource "aws_ecs_task_definition" "mq" {
  family                   = var.task_family
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode(local.container_definitions)

  volume {
    name = "qm1data"
    efs_volume_configuration {
      file_system_id     = aws_efs_file_system.mq.id
      transit_encryption = "ENABLED"
      authorization_config {
        access_point_id = aws_efs_access_point.mq.id
        iam             = "ENABLED"
      }
    }
  }
}

#Service
resource "aws_ecs_service" "mq" {
  name            = var.service_name
  cluster         = aws_ecs_cluster.mq.id
  task_definition = aws_ecs_task_definition.mq.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  # MQ takes an exclusive lock on EFS, so the old task must stop before the
  # new one starts.
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  #Stop a bad deployment within minutes instead of waiting hours.
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  health_check_grace_period_seconds = var.health_check_grace_period_seconds

  network_configuration {
    subnets          = data.aws_subnets.public.ids
    security_groups  = [aws_security_group.task.id]
    assign_public_ip = true # outbound access to ECR / Secrets Manager / icr.io
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "fe"
    container_port   = var.frontend_port
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.mq_console.arn
    container_name   = "mq"
    container_port   = var.mq_console_port
  }

  depends_on = [
    aws_lb_listener.frontend,
    aws_lb_listener.mq_console,
    aws_efs_mount_target.mq, # first task fails with EFS DNS errors otherwise
    terraform_data.frontend_image,
    terraform_data.backend_image,
    aws_iam_role_policy_attachment.execution,
    aws_iam_role_policy.execution_secrets,
    aws_iam_role_policy.task_efs,
  ]
}
