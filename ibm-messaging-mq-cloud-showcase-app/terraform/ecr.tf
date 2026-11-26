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

# Equivalent of CDK's DockerImageAsset: build the frontend and backend images
# from the local Dockerfiles (linux/amd64, required by Fargate x86_64) and push
# them to ECR. Requires podman (or docker, see var.container_cli) and the aws CLI on the machine
# running terraform. Images are tagged with a hash of their sources, so any
# source change builds, pushes and rolls out a new task definition.

data "aws_caller_identity" "current" {}

locals {
  registry     = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com"
  repo_root    = abspath("${path.module}/..")
  frontend_dir = "${local.repo_root}/frontend"
  backend_dir  = "${local.repo_root}/backend"

  frontend_files = setunion(
    fileset(local.frontend_dir, "AWS-MQ-showcase/{src,public}/**"),
    fileset(local.frontend_dir, "AWS-MQ-showcase/{package.json,package-lock.json,index.html,tsconfig.json,vite.config.ts}"),
    fileset(local.frontend_dir, "{Dockerfile,docker-entrypoint.sh,nginx.conf.template,nginx.conf.proxy.template}"),
  )
  backend_files = setunion(
    fileset(local.backend_dir, "AWS-showcase-backend/**"),
    fileset(local.backend_dir, "Dockerfile"),
  )

  frontend_tag = substr(sha1(join("", concat(
    [var.coding_challenge],
    [for f in sort(tolist(local.frontend_files)) : filesha1("${local.frontend_dir}/${f}")]
  ))), 0, 16)

  backend_tag = substr(sha1(join("",
    [for f in sort(tolist(local.backend_files)) : filesha1("${local.backend_dir}/${f}")
    if !strcontains(f, "node_modules/")]
  )), 0, 16)

  frontend_image = "${aws_ecr_repository.frontend.repository_url}:${local.frontend_tag}"
  backend_image  = "${aws_ecr_repository.backend.repository_url}:${local.backend_tag}"
}

resource "aws_ecr_repository" "frontend" {
  name         = "mqonaws/frontend"
  force_delete = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "backend" {
  name         = "mqonaws/backend"
  force_delete = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "terraform_data" "frontend_image" {
  triggers_replace = [local.frontend_image]

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]
    command     = <<-EOT
      set -euo pipefail
      aws ecr get-login-password --region ${var.region} | ${var.container_cli} login --username AWS --password-stdin ${local.registry}
      ${var.container_cli} build --platform linux/amd64 \
        --build-arg REACT_APP_IS_FOR_CODING_CHALLENGE=${var.coding_challenge} \
        -t ${local.frontend_image} ${local.frontend_dir}
      ${var.container_cli} push ${local.frontend_image}
    EOT
  }
}

resource "terraform_data" "backend_image" {
  triggers_replace = [local.backend_image]

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]
    command     = <<-EOT
      set -euo pipefail
      aws ecr get-login-password --region ${var.region} | ${var.container_cli} login --username AWS --password-stdin ${local.registry}
      ${var.container_cli} build --platform linux/amd64 \
        -t ${local.backend_image} ${local.backend_dir}
      ${var.container_cli} push ${local.backend_image}
    EOT
  }
}
