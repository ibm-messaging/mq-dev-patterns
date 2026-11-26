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

# Persistent queue manager storage. Mount targets go in the same (public
# default) subnets as the Fargate tasks.

resource "aws_efs_file_system" "mq" {
  creation_token = var.efs_name
  encrypted      = true

  tags = {
    Name = var.efs_name
  }
}

resource "aws_efs_mount_target" "mq" {
  # One mount target per subnet; sorted so ordering is stable between runs
  count           = length(data.aws_subnets.public.ids)
  file_system_id  = aws_efs_file_system.mq.id
  subnet_id       = sort(data.aws_subnets.public.ids)[count.index]
  security_groups = [aws_security_group.efs.id]
}

# Grants the MQ container (uid 1001, gid 0) write access.
resource "aws_efs_access_point" "mq" {
  file_system_id = aws_efs_file_system.mq.id

  posix_user {
    uid = 1001
    gid = 0
  }

  root_directory {
    path = "/mqm"
    creation_info {
      owner_uid   = 1001
      owner_gid   = 0
      permissions = "0770"
    }
  }
}
