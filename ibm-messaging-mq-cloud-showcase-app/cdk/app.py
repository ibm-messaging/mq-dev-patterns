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

import os
import yaml
import aws_cdk as cdk
from dotenv import load_dotenv
from mq_stack import MqShowcaseStack

# Load .env from the project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

app_password   = os.environ.get('APP_PASSWORD')
admin_password = os.environ.get('ADMIN_PASSWORD')

if not app_password or not admin_password:
    raise ValueError(
        'APP_PASSWORD and ADMIN_PASSWORD must be set in the .env file at the project root '
        'or as environment variables.'
    )

# Load stack configuration from mq-config.yaml
config_path = os.path.join(os.path.dirname(__file__), 'mq-config.yaml')
if not os.path.exists(config_path):
    raise FileNotFoundError(
        f'Configuration file not found: {config_path}\n'
        'Ensure mq-config.yaml exists in the cdk/ directory.'
    )
with open(config_path, 'r') as f:
    mq_config = yaml.safe_load(f)

app = cdk.App()

MqShowcaseStack(
    app,
    'MqShowcaseStack',
    app_password=app_password,
    admin_password=admin_password,
    mq_config=mq_config,
    env=cdk.Environment(
        account=os.environ.get('CDK_DEFAULT_ACCOUNT'),
        region=os.environ.get('CDK_DEFAULT_REGION'),
    ),
)

app.synth()
