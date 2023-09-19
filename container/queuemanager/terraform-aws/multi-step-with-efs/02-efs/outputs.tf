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


# Output the EFS ID and Access Point

output "efs_id" {
  description = "EFS ID"
  value = aws_efs_file_system.efs_persist.id
}

output "efs_access_point_id" {
  description = "EFS access point for Init"
  value = aws_efs_access_point.fargate.id
}

# Output these values to double check with VPC output to
# verify that they were extrapalated correctly

output "private_subnets_used" {
  value = data.aws_subnets.private.ids
}

output "cidr_block_used" {
  value = data.aws_vpc.mq_vpc.cidr_block
}