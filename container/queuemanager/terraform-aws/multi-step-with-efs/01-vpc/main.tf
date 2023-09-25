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


# Create a new VPC making use of the terraform aws vpc module
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "mq-ecs-vpc"
  cidr = var.vpc_cidr_block

  azs             = data.aws_availability_zones.available_zones.names
  private_subnets = slice(var.private_subnet_cidr_blocks, 0, var.private_subnet_count)
  public_subnets  = slice(var.public_subnet_cidr_blocks, 0, var.public_subnet_count)

  # Tag the subnets so that they can be differentiated downstream.
  private_subnet_tags = {
    Tier  = "private"
    Usage = "mq"
  }

  public_subnet_tags = {
    Tier  = "public"
    Usage = "mq"
  }

  enable_nat_gateway = true
  enable_vpn_gateway = var.enable_vpn_gateway
}

# This script needs to be able to access the AWS AZs
data "aws_availability_zones" "available_zones" {
  state = "available"
}
