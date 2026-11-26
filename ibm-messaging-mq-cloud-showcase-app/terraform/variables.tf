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

variable "region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-west-1"
}

#Secrets (supply via TF_VAR_app_password / TF_VAR_admin_password or an untracked tfvars file)
variable "app_password" {
  description = "IBM MQ app user password"
  type        = string
  sensitive   = true
}

variable "admin_password" {
  description = "IBM MQ admin user password"
  type        = string
  sensitive   = true
}

variable "app_password_secret_name" {
  type    = string
  default = "mqonaws/app-password"
}

variable "admin_password_secret_name" {
  type    = string
  default = "mqonaws/admin-password"
}

#Networking
variable "allowed_ingress_cidr" {
  description = "CIDR allowed to reach the NLB on ports 80 and 9443. Restrict this where possible."
  type        = string
  default     = "0.0.0.0/0"
}

#MQ container
variable "mq_image" {
  type    = string
  default = "icr.io/ibm-messaging/mq:latest"
}

variable "mq_qmgr_name" {
  type    = string
  default = "QM1"
}

variable "mq_cpu" {
  type    = number
  default = 1024
}

variable "mq_memory" {
  type    = number
  default = 2048
}

variable "mq_mqi_port" {
  type    = number
  default = 1414
}

variable "mq_console_port" {
  type    = number
  default = 9443
}

#Backend container
variable "backend_cpu" {
  type    = number
  default = 2048
}

variable "backend_memory" {
  type    = number
  default = 4096
}

variable "backend_port" {
  type    = number
  default = 8080
}

#Frontend container
variable "frontend_cpu" {
  type    = number
  default = 1024
}

variable "frontend_memory" {
  type    = number
  default = 2048
}

variable "frontend_port" {
  type    = number
  default = 3000
}

variable "container_cli" {
  description = "Container CLI used to build and push the frontend/backend images (podman or docker)"
  type        = string
  default     = "podman"
}

variable "coding_challenge" {
  description = "Build-time flag (REACT_APP_IS_FOR_CODING_CHALLENGE) baked into the frontend bundle"
  type        = string
  default     = "false"

  validation {
    condition     = contains(["true", "false"], var.coding_challenge)
    error_message = "coding_challenge must be \"true\" or \"false\"."
  }
}

#Task, cluster and service
variable "task_cpu" {
  type    = number
  default = 4096
}

variable "task_memory" {
  type    = number
  default = 16384
}

variable "task_family" {
  type    = string
  default = "mqonaws"
}

variable "cluster_name" {
  type    = string
  default = "mqonaws"
}

variable "service_name" {
  type    = string
  default = "mqonaws-svc"
}

variable "health_check_grace_period_seconds" {
  description = "Time ECS ignores NLB health checks after task start, to allow MQ to come up"
  type        = number
  default     = 300
}

variable "efs_name" {
  type    = string
  default = "qm1data"
}

variable "log_group_name" {
  type    = string
  default = "/ecs/mqonaws"
}
