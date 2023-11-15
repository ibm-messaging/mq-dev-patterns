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

# The region used by the all .tf files
variable "region" {
  description = "The aws region to apply these services to"
  default     = "eu-west-2"
  type        = string
}

variable "mq_app_password" {
  description = "The App user password for MQ"
  type        = string
  sensitive   = true
}

variable "mq_admin_password" {
  description = "The Admin user password for MQ"
  type        = string
  sensitive   = true
}

variable "envvars" {
  type        = map(string)
  description = "variables to set in the environment of the container"
  default = {
    "LICENSE"      = "accept",
    "MQ_QMGR_NAME" = "QM1"
  }
}

# The container name needs to be consistent so that the
# ECS service can correctly configure the load balancer.
variable "mq_container_name" {
  description = "Container name"
  default     = "mq-container"
  type        = string
}

# The number of running containers 
variable "app_count" {
  type    = number
  default = 1
}

# The log group is paramertized as its usage needs to
# be consistent throughout the script. Otherwise the
# queuemanager image will fail to start, as it hits
# errors when trying to log.  
variable "log_group" {
  description = "CloudWatch log group"
  default     = "/devex/mq/terraform"
  type        = string
}

variable "enable_vpn_gateway" {
  description = "Enable a VPN gateway in your VPC."
  type        = bool
  default     = false
}

variable "public_subnet_count" {
  description = "Number of public subnets."
  type        = number
  default     = 2
}

variable "private_subnet_count" {
  description = "Number of private subnets."
  type        = number
  default     = 2
}

variable "vpc_cidr_block" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# cidr blocks reserved for the public vpc subnets 
variable "public_subnet_cidr_blocks" {
  description = "Available cidr blocks for public subnets"
  type        = list(string)
  default = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24",
    "10.0.4.0/24",
    "10.0.5.0/24",
    "10.0.6.0/24",
    "10.0.7.0/24",
    "10.0.8.0/24",
  ]
}

# cidr blocks reserved for the public vpc subnets 
variable "private_subnet_cidr_blocks" {
  description = "Available cidr blocks for private subnets"
  type        = list(string)
  default = [
    "10.0.101.0/24",
    "10.0.102.0/24",
    "10.0.103.0/24",
    "10.0.104.0/24",
    "10.0.105.0/24",
    "10.0.106.0/24",
    "10.0.107.0/24",
    "10.0.108.0/24",
  ]
}
