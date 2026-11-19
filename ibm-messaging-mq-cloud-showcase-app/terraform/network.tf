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

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

# NLB SG - accepts inbound traffic on the application ports
resource "aws_security_group" "nlb" {
  name        = "mqonaws-nlb-sg"
  description = "MQ on AWS NLB - inbound from allowed CIDR"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_vpc_security_group_ingress_rule" "nlb_http" {
  security_group_id = aws_security_group.nlb.id
  description       = "Frontend HTTP"
  cidr_ipv4         = var.allowed_ingress_cidr
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_ingress_rule" "nlb_console" {
  security_group_id = aws_security_group.nlb.id
  description       = "MQ Console HTTPS"
  cidr_ipv4         = var.allowed_ingress_cidr
  ip_protocol       = "tcp"
  from_port         = var.mq_console_port
  to_port           = var.mq_console_port
}

resource "aws_vpc_security_group_egress_rule" "nlb_all" {
  security_group_id = aws_security_group.nlb.id
  description       = "NLB to targets"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# Task security group - inbound only from the NLB
resource "aws_security_group" "task" {
  name        = "mqonaws-task-sg"
  description = "MQ on AWS task - accept only from NLB"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_vpc_security_group_ingress_rule" "task_frontend" {
  security_group_id            = aws_security_group.task.id
  description                  = "Frontend from NLB"
  referenced_security_group_id = aws_security_group.nlb.id
  ip_protocol                  = "tcp"
  from_port                    = var.frontend_port
  to_port                      = var.frontend_port
}

resource "aws_vpc_security_group_ingress_rule" "task_console" {
  security_group_id            = aws_security_group.task.id
  description                  = "MQ Console from NLB"
  referenced_security_group_id = aws_security_group.nlb.id
  ip_protocol                  = "tcp"
  from_port                    = var.mq_console_port
  to_port                      = var.mq_console_port
}

# HTTPS for Secrets Manager + ECR + icr.io, HTTP for ECR auth
resource "aws_vpc_security_group_egress_rule" "task_https" {
  security_group_id = aws_security_group.task.id
  description       = "HTTPS outbound (Secrets Manager, ECR, icr.io)"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_egress_rule" "task_http" {
  security_group_id = aws_security_group.task.id
  description       = "HTTP outbound (ECR auth)"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_egress_rule" "task_nfs" {
  security_group_id = aws_security_group.task.id
  description       = "NFS to EFS"
  cidr_ipv4         = data.aws_vpc.default.cidr_block
  ip_protocol       = "tcp"
  from_port         = 2049
  to_port           = 2049
}

resource "aws_vpc_security_group_egress_rule" "task_dns_udp" {
  security_group_id = aws_security_group.task.id
  description       = "DNS outbound"
  cidr_ipv4         = data.aws_vpc.default.cidr_block
  ip_protocol       = "udp"
  from_port         = 53
  to_port           = 53
}

resource "aws_vpc_security_group_egress_rule" "task_dns_tcp" {
  security_group_id = aws_security_group.task.id
  description       = "DNS outbound TCP"
  cidr_ipv4         = data.aws_vpc.default.cidr_block
  ip_protocol       = "tcp"
  from_port         = 53
  to_port           = 53
}

# EFS security group - NFS only from the task
resource "aws_security_group" "efs" {
  name        = "mqonaws-efs-sg"
  description = "MQ on AWS EFS - NFS from task only"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_vpc_security_group_ingress_rule" "efs_nfs" {
  security_group_id            = aws_security_group.efs.id
  description                  = "EFS NFS from task"
  referenced_security_group_id = aws_security_group.task.id
  ip_protocol                  = "tcp"
  from_port                    = 2049
  to_port                      = 2049
}
