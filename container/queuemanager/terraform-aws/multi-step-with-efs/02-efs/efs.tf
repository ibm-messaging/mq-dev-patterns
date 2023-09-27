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

resource "aws_efs_file_system" "efs_persist" {
  creation_token = "our-efs-creation-token"
  encrypted      = true

  lifecycle_policy {
    transition_to_ia = "AFTER_7_DAYS"
  }
}


resource "aws_efs_access_point" "fargate" {
  file_system_id = aws_efs_file_system.efs_persist.id
  root_directory {
    path = "/qm1"
    creation_info {
      owner_gid   = 0
      owner_uid   = 0
      permissions = 730
    }
  }
}

resource "aws_security_group" "shared_efs" {
  name        = "persist-sg"
  description = "Allow EFS inbound traffic from VPC"
  vpc_id      = data.aws_vpc.mq_vpc.id

  ingress {
    description = "NFS traffic from VPC"
    from_port   = 2049
    to_port     = 2049
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.mq_vpc.cidr_block]
  }
}

# Put mount target in each of private subnets that accessing 
# application (queue manager) can be placed.
resource "aws_efs_mount_target" "mount" {
  count           = length(data.aws_subnets.private.ids)
  file_system_id  = aws_efs_file_system.efs_persist.id
  subnet_id       = data.aws_subnets.private.ids[count.index]
  security_groups = [aws_security_group.shared_efs.id]
}

resource "aws_efs_file_system_policy" "policy" {
  file_system_id                     = aws_efs_file_system.efs_persist.id
  bypass_policy_lockout_safety_check = true

  policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AccessEFS",
            "Effect": "Allow",
            "Principal": {
                "AWS": "*"
            },
            "Action": [
                "elasticfilesystem:*"
            ],
            "Resource": "${aws_efs_mount_target.mount[0].file_system_arn}"
        }
    ]
}
POLICY
}
