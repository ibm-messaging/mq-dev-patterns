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

# After running 
#      terraform apply
# Run 
#      terraform output
# to see the VPC ID
# The CIDR block and subnets can be obtained using a data stanza
# but are output here to check the values. 

output "vpc_id" {
  description = "VPC ID"
  value = module.vpc.vpc_id
}

output "cidr_block" {
  value = module.vpc.vpc_cidr_block
}

output "vpc_private_subnets" {
  description = "Private Subnets"
  value = module.vpc.private_subnets
}

output "vpc_public_subnets" {
  description = "Public Subnets"
  value = module.vpc.public_subnets
}


