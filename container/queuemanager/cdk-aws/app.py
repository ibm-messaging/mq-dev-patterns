#!/usr/bin/env python3
#
# Copyright 2026 IBM Corp.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

import os
import sys
import yaml
import aws_cdk as cdk
from mq_ecs_cdk.mq_ecs_cdk_stack import MqEcsCdkStack

app = cdk.App()

# Read and parse mq-config.yaml
config_path = os.path.join(os.path.dirname(__file__), "mq-config.yaml")

try:
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
except FileNotFoundError:
    print(f"Error: Configuration file not found: {config_path}", file=sys.stderr)
    sys.exit(1)
except yaml.YAMLError as e:
    print(f"Error: mq-config.yaml is not valid YAML: {e}", file=sys.stderr)
    sys.exit(1)
except OSError as e:
    print(f"Error: Could not read configuration file: {e}", file=sys.stderr)
    sys.exit(1)

if config is None:
    print("Error: mq-config.yaml is empty.", file=sys.stderr)
    sys.exit(1)

# Resolve passwords: CLI context flags take priority over mq-config.yaml values.
# Using explicit None checks so that an empty string "" in YAML is also treated as missing.
sec_cfg = config.get("security", {})
ctx_app = app.node.try_get_context("app_password")
ctx_admin = app.node.try_get_context("admin_password")
app_password = ctx_app if ctx_app is not None else sec_cfg.get("appPassword")
admin_password = ctx_admin if ctx_admin is not None else sec_cfg.get("adminPassword")

# Validate passwords only when deploying/synth-ing.
# cdk destroy re-synthesizes the app but sets aws:cdk:bundling-stacks to an empty list [].
# cdk deploy sets it to the list of stacks being deployed e.g. ["MqEcsCdkStack"].
# If bundling-stacks is empty (or absent entirely, i.e. direct python3 app.py run),
# passwords are not needed so we skip the check.
bundling_stacks = app.node.try_get_context("aws:cdk:bundling-stacks")
is_deploy = isinstance(bundling_stacks, list) and len(bundling_stacks) > 0
if is_deploy and (not (app_password or "").strip() or not (admin_password or "").strip()):
    print(
        "Error: Passwords must be provided. Pass them via CDK context flags:\n"
        "  cdk deploy -c app_password=<password> -c admin_password=<password>\n"
        "Or set appPassword and adminPassword in mq-config.yaml.",
        file=sys.stderr
    )
    sys.exit(1)

# Target active AWS account and region from environment / AWS CLI configuration
MqEcsCdkStack(
    app, "MqEcsCdkStack",
    mq_config=config,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION", "us-west-1")
    ),
)

app.synth()
