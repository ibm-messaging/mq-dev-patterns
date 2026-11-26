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

# MQ passwords live in Secrets Manager; ECS injects them at task start so they never appear in the task definition.
# recovery_window_in_days = 0 lets `terraform destroy` + `apply` reuse the name

resource "aws_secretsmanager_secret" "app" {
  name                    = var.app_password_secret_name
  description             = "IBM MQ app user password"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id                = aws_secretsmanager_secret.app.id
  secret_string_wo         = var.app_password
  secret_string_wo_version = 1
}

resource "aws_secretsmanager_secret" "admin" {
  name                    = var.admin_password_secret_name
  description             = "IBM MQ admin user password"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "admin" {
  secret_id                = aws_secretsmanager_secret.admin.id
  secret_string_wo         = var.admin_password
  secret_string_wo_version = 1
}
