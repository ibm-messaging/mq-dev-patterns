# Using AWS CDK (Python) to deploy IBM MQ Advanced for Developers onto AWS

These files provide a starter set which can be used to deploy an **IBM MQ Advanced for Developers** queue manager container onto **Amazon ECS Fargate** using the **AWS Cloud Development Kit (CDK)** in Python.

Infrastructure is defined declaratively in `mq-config.yaml` and provisioned automatically by the CDK stack. Passwords are stored in **AWS Secrets Manager** and injected into the container at runtime — no plain text secrets in the Task Definition.

We have tested this configuration with an AWS identity that has `AdministratorAccess` permission.

## Prerequisites

- **Node.js (v18+) & npm** — required for the AWS CDK CLI
- **AWS CDK CLI** — install globally: `npm install -g aws-cdk`
- **Python 3.9+ & pip**
- **AWS CLI** — authenticated to your target account: `aws sts get-caller-identity`

## IAM Permissions

We have tested with `AdministratorAccess`. The following AWS managed policies cover the minimum set of permissions required by this stack:

| Policy | Why needed |
|---|---|
| `AmazonECS_FullAccess` | Create ECS cluster, task definition, and Fargate service |
| `AmazonEC2FullAccess` | Look up default VPC and create security groups |
| `AmazonElasticFileSystemFullAccess` | Create EFS file system and access point |
| `ElasticLoadBalancingFullAccess` | Create Network Load Balancer, target groups, and listeners |
| `SecretsManagerReadWrite` | Create and manage the MQ credentials secret |
| `IAMFullAccess` | Create ECS task role and execution role |
| `CloudWatchLogsFullAccess` | Create log group for container logs |
| `AWSCloudFormationFullAccess` | CDK deploys infrastructure via CloudFormation |

> **Note:** You may wish to restrict these policies further to suit your security requirements.

## Files

```text
aws-cdk-python-yaml/
├── mq-config.yaml          # Declarative configuration (image, CPU, memory, ports)
├── app.py                  # CDK app entry point — reads mq-config.yaml
├── mq_ecs_cdk/
│   ├── __init__.py
│   └── mq_ecs_cdk_stack.py # Infrastructure construct definitions
├── requirements.txt        # Python dependencies (aws-cdk-lib, constructs, pyyaml)
└── cdk.json                # CDK execution metadata
```

## mq-config.yaml

The `mq-config.yaml` file controls the queue manager name, container image, CPU, memory, and ports.

Passwords can be set in the `security` section of this file, or passed at deploy time via CDK context flags. **CDK context flags always take priority over values in the YAML file.** If neither is provided, the deployment will abort with an error.

We recommend passing passwords via context flags so they are never stored in any file:

```
cdk deploy \
  -c app_password="YourSecureAppPassword" \
  -c admin_password="YourSecureAdminPassword"
```

## AWS CLI

The CDK CLI makes use of your AWS CLI configuration. No separate AWS login is required — if you have already run `aws configure` or set up AWS SSO, the CDK commands will use that configuration automatically.

## Bootstrap (one-time per account/region)

Before deploying for the first time, bootstrap your AWS environment:

```
cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
```

## Install dependencies

```
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Deploy

```
cdk deploy \
  -c app_password="YourSecureAppPassword" \
  -c admin_password="YourSecureAdminPassword"
```

When prompted `Do you wish to deploy these changes (y/n)?`, review the IAM and security group changes and enter `y`.

Deployment completes in approximately 4–5 minutes. The outputs will include the NLB DNS name:

```
Outputs:
MqEcsCdkStack.MqHost = MqEcsC-MqNLB-XXXXXXXX.elb.<region>.amazonaws.com
MqEcsCdkStack.MqConsoleUrl = https://MqEcsC-MqNLB-XXXXXXXX.elb.<region>.amazonaws.com:9443/ibmmq/console/
```

## Testing

### REST API (port 9443)

```
curl -k -i -u "app:<APP_PASSWORD>" \
  -H "ibm-mq-rest-csrf-token: value" \
  -H "Content-Type: text/plain;charset=utf-8" \
  -X POST "https://<MQ_HOST>:9443/ibmmq/rest/v1/messaging/qmgr/QM1/queue/DEV.QUEUE.1/message" \
  -d 'Hello IBM MQ!'
```

`HTTP 201 Created` confirms the message was queued.

```
curl -k -u "app:<APP_PASSWORD>" \
  -H "ibm-mq-rest-csrf-token: value" \
  -X DELETE "https://<MQ_HOST>:9443/ibmmq/rest/v1/messaging/qmgr/QM1/queue/DEV.QUEUE.1/message"
```

### Native MQ client (port 1414)

Use the Python samples from the `mq-dev-patterns` repository. See `../../../Python/README.md` for instructions on installing the IBM MQ C client libraries for your platform, then:

```
cd ../../../Python
export JSON_CONFIG=./env.json
python basicput.py
python basicget.py
```

### IBM MQ Web Console

Open `https://<MQ_HOST>:9443/ibmmq/console/` in your browser and log in with the `admin` user and the `admin_password` you passed to `cdk deploy`.

## Destroy

To remove all AWS resources created by this stack:

```
cdk destroy
```
