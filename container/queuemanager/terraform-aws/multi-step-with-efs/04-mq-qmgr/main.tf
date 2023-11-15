#
# * Copyright 2023 IBM Corp.
# *
# * Licensed under the Apache License, Version 2.0 (the 'License');
# * you may not use this file except in compliance with the License.
# * You may obtain a copy of the License at
# *
# * http://www.apache.org/licenses/LICENSE-2.0
# *
# * Unless required by applicable law or agreed to in writing, software
# * distributed under the License is distributed on an "AS IS" BASIS,
# * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# * See the License for the specific language governing permissions and
# * limitations under the License.

# This AssumeRole policy is needed to allow logging. 
# If Logging to CloudWatch isn't needed, then this AssumeRole policy can be removed.
# Without it you will get the following exception
# ClientException: Fargate requires task definition to have execution role ARN to support log driver awslogs.

#
# data blocks
#

data "aws_iam_policy_document" "ecs_task_execution_role" {
  version = "2012-10-17"
  statement {
    sid     = ""
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# This script needs to be able to access the AWS AZs
data "aws_availability_zones" "available_zones" {
  state = "available"
}


#
# resource blocks
#

# Task execution role and policy for AssumeRole to enable logging.
resource "aws_iam_role" "ecs_task_execution_role" {
  name               = "ecs-staging-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_role.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}


# Create the load balancer security group. 
# All ingress groups are defined as rules, allowing them
# to be amended.
resource "aws_security_group" "lb" {
  name   = "mq-nlb-security-group"
  vpc_id = data.aws_vpc.mq_vpc.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Allow MQI traffic into the load balancer
resource "aws_security_group_rule" "allow_mq_1414_traffic" {
  type              = "ingress"
  security_group_id = aws_security_group.lb.id

  from_port   = 1414
  to_port     = 1414
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}

# Allow 443 traffic from the load balancer and forward to
# 9443 queue manager port.
resource "aws_security_group_rule" "allow_mq_9443_traffic" {
  type              = "ingress"
  security_group_id = aws_security_group.lb.id

  from_port   = 443
  to_port     = 9443
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}

# Add Network Load Balancer which will be acting as a firewall to the queue manager
resource "aws_lb" "default" {
  name               = "mq-nlb"
  load_balancer_type = "network"
  subnets            = data.aws_subnets.public.ids
  security_groups    = [aws_security_group.lb.id]
}

resource "aws_lb_target_group" "mq1414" {
  name        = "mq1414-target-group"
  port        = 1414
  protocol    = "TCP"
  vpc_id      = data.aws_vpc.mq_vpc.id
  target_type = "ip"
}

resource "aws_lb_target_group" "mq9443" {
  name        = "mq9443-target-group"
  port        = 9443
  protocol    = "TCP"
  vpc_id      = data.aws_vpc.mq_vpc.id
  target_type = "ip"
}

# Forward 443 traffic into the load balancer to flow to port 9443 
# for the queue manager target group
resource "aws_lb_listener" "mqon9443" {
  load_balancer_arn = aws_lb.default.id
  port              = "443"
  protocol          = "TCP"

  default_action {
    target_group_arn = aws_lb_target_group.mq9443.id
    type             = "forward"
  }
}

# Forward 1414 traffic on load balancer to queue manager target group
resource "aws_lb_listener" "mqon1414" {
  load_balancer_arn = aws_lb.default.id
  port              = "1414"
  protocol          = "TCP"

  default_action {
    target_group_arn = aws_lb_target_group.mq1414.id
    type             = "forward"
  }
}

# Define the ECS Task and identify underlying container. 
resource "aws_ecs_task_definition" "mq_task" {
  family                   = "mq-dev"
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  requires_compatibilities = ["FARGATE"]
  cpu                      = 1024
  memory                   = 2048

  container_definitions = templatefile("${path.module}/mq-container-json.tftpl", {
    MQ_HTTP_PORT      = 9443,
    MQ_MQI_PORT       = 1414,
    MQ_CONTAINER_NAME = var.mq_container_name,
    LOG_GROUP_NAME    = var.log_group,
    MQ_APP_PASSWORD   = var.mq_app_password,
    MQ_ADMIN_PASSWORD = var.mq_admin_password,
    REGION            = var.region,
    ENVVARS           = var.envvars
  })

  volume {
    name = "efs-volume"
    efs_volume_configuration {
      file_system_id     = data.aws_efs_file_system.mq.id
      root_directory     = "/"
      transit_encryption = "ENABLED"
      authorization_config {
        access_point_id = data.aws_efs_access_point.mq.id
      }
    }
  }

}

# Queue Manager security group. 
# Ingress rules are defined separately.
resource "aws_security_group" "mq_task_secuity_group" {
  name   = "mq-task-security-group"
  vpc_id = data.aws_vpc.mq_vpc.id

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Allow 1414 traffic into the queue manager
resource "aws_security_group_rule" "allow_hw_1414" {
  type              = "ingress"
  security_group_id = aws_security_group.mq_task_secuity_group.id

  from_port = 1414
  to_port   = 1414
  protocol  = "tcp"

  # Only allow traffic from apps running in this VPC
  # private and public subnets
  cidr_blocks = [data.aws_vpc.mq_vpc.cidr_block]
}

# Allow 9443 traffic into the queue manager
resource "aws_security_group_rule" "allow_hw_9443" {
  type              = "ingress"
  security_group_id = aws_security_group.mq_task_secuity_group.id

  from_port = 9443
  to_port   = 9443
  protocol  = "tcp"

  # Only allow traffic from apps running in this VPC
  # private and public subnets
  cidr_blocks = [data.aws_vpc.mq_vpc.cidr_block]
}

# Create the cloudwatch log group. 
# The log group name used by the ecs task definition must match this name.
resource "aws_cloudwatch_log_group" "mqlogs" {
  name = var.log_group
  # skip_destroy = true 
  # retention_in_days = 3
}


# Create the ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "mq-cluster"
}

# Once all the above pre-reqs are in place the ECS
# service can be created.
resource "aws_ecs_service" "mq-dev-service" {
  # By default count is 1
  # If you want to delete this aws_ecs_service only
  # then set the count to 0 
  # count = 0
  name            = "mq-development-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.mq_task.arn
  desired_count   = var.app_count
  launch_type     = "FARGATE"

  # If set will force new deployment on every apply
  # force_new_deployment = true

  network_configuration {
    security_groups = [aws_security_group.mq_task_secuity_group.id]
    subnets         = data.aws_subnets.private.ids
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.mq9443.id
    container_name   = var.mq_container_name
    container_port   = 9443
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.mq1414.id
    container_name   = var.mq_container_name
    container_port   = 1414
  }

  # depends_on is set to the two listeners as well as the task execution role. 
  # The role depends is to prevent a race condition during service deletion, 
  # otherwise, the policy may be destroyed too soon and the ECS service will 
  # then get stuck in the DRAINING state.
  # See https://registry.terraform.io/providers/figma/aws-4-49-0/latest/docs/resources/ecs_service
  depends_on = [aws_lb_listener.mqon9443, aws_lb_listener.mqon1414, aws_iam_role_policy_attachment.ecs_task_execution_role]
}


