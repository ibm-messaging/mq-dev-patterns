# IBM MQ Messaging Playground Application

## Description

A detailed usage of this IBM MQ Messaging Playground Application is provided in the following tutorial: [AWS-TUTORIAL-URL](https://developer.ibm.com/tutorials/mq-build-deploy-ibm-mq-app-to-aws-cloud/). The application is underpinned by three containers (frontend, backend, MQ).

Before deploying the containers, configure the following variables in the `.env` file:

- `APP_PASSWORD`: the password you want to set for the MQ app user
- `ADMIN_PASSWORD`: the password you want to set for the MQ admin user

## Environment

### Local Machine (Podman)

> **Note:** All commands use `podman-compose`. Install [Podman Desktop](https://podman.io/) and `podman-compose` (`pip install podman-compose` or `brew install podman-compose`) if you don't have them yet.

1. Fill in your passwords in `.env`:

       APP_PASSWORD=<your-app-password>
       ADMIN_PASSWORD=<your-admin-password>

2. Build the images:

       cd mq-dev-patterns/ibm-messaging-mq-cloud-showcase-app/
       podman-compose -f docker-compose.yaml build

3. Start all three containers:

       podman-compose -f docker-compose.yaml up

4. After all three containers are running:
   - Playground app → http://localhost:3000
   - MQ web console → https://localhost:9443/ibmmq/console

#### Running on Apple Silicon (ARM64)

The IBM MQ image (`icr.io/ibm-messaging/mq:latest`) is `linux/amd64` only. Podman on Apple Silicon will transparently run it under emulation thanks to the `platform: linux/amd64` directive already set in `docker-compose.yaml`.

If you prefer a native ARM64 image, follow [this guide](https://community.ibm.com/community/user/integration/blogs/richard-coppen/2023/06/30/ibm-mq-9330-container-image-now-available-for-appl) to build one from the [MQ Container GitHub repo](https://github.com/ibm-messaging/mq-container/blob/master/docs/building.md), then edit `docker-compose.yaml` and replace:

```yaml
image: "icr.io/ibm-messaging/mq:latest"
```

with the name of the ARM64 image you built, e.g.:

```yaml
image: "ibm-mqadvanced-server-dev:9.4.1.0-arm64"
```

### AWS Cloud (CDK)

The `cdk/` directory contains a Python AWS CDK stack that deploys the full three-tier application to AWS ECS Fargate with an EFS-backed queue manager.

#### Prerequisites

- Python 3.11+
- Node.js 18+ (for the CDK CLI via `npx`)
- AWS CLI configured (`aws configure`)

#### First-time setup

```bash
cd cdk
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### Bootstrap your AWS account (once per account/region)

```bash
npx cdk bootstrap
```

#### Configure

Edit `cdk/mq-config.yaml` to set the MQ image, CPU/memory limits, and port numbers.

MQ passwords are stored in **AWS Secrets Manager** — the CDK stack creates the secret automatically. After deploying, update the secret value in the AWS console or with the CLI:

```bash
aws secretsmanager put-secret-value \
  --secret-id mq/passwords \
  --secret-string '{"APP_PASSWORD":"<your-app-password>","ADMIN_PASSWORD":"<your-admin-password>"}'
```

#### Deploy

```bash
cd cdk
source .venv/bin/activate
npx cdk deploy
```

> **Optional:** run `npx cdk synth` first to print the generated CloudFormation template without deploying.

#### Tear down

```bash
npx cdk destroy
```
