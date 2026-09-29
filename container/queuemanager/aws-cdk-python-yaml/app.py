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
import yaml
import aws_cdk as cdk
from mq_ecs_cdk.mq_ecs_cdk_stack import MqEcsCdkStack

app = cdk.App()

# Read and parse mq-config.yaml
config_path = os.path.join(os.path.dirname(__file__), "mq-config.yaml")
with open(config_path, "r") as f:
    config = yaml.safe_load(f)

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
