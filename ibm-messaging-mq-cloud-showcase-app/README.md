# IBM MQ Messaging Playground — AWS Deployment

Deploy the IBM MQ messaging playground application to AWS using the AWS CDK.

For a full step-by-step tutorial, see **[Build and deploy an IBM MQ app to AWS Cloud](https://developer.ibm.com/tutorials/mq-build-deploy-ibm-mq-app-to-aws-cloud/)** on IBM Developer.

## Prerequisites

- Python 3.9 or later
- Node.js 22 or later (for `npx cdk` commands only)
- [Podman](https://podman.io/) for building container images locally
- AWS CLI configured with your credentials (`aws configure`)

## Configuration

After cloning the repository, edit the `.env` file in the project root and set your own passwords:

```
APP_PASSWORD=<your-app-password>
ADMIN_PASSWORD=<your-admin-password>
```

- `APP_PASSWORD` — used by the backend to connect to the MQ queue manager
- `ADMIN_PASSWORD` — used to log in to the IBM MQ Web Console

These passwords are stored in AWS Secrets Manager during deployment and injected into the containers at runtime — never stored as plaintext in any AWS resource.

## Local development

Run all three services locally using Podman:

```bash
podman compose up --build
```

Access the app at `http://localhost:3000` and the MQ console at `https://localhost:9443/ibmmq/console`.

## Deploy to AWS

### 1. Set up the Python environment

```bash
cd cdk
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Bootstrap CDK (once per AWS account/region)

```bash
npx cdk bootstrap
```

You only need to run this once per AWS account and region.

### 3. Deploy

```bash
npx cdk deploy
```

CDK will:
- Build the frontend and backend container images from the local Dockerfiles
- Push them to ECR
- Create all AWS infrastructure: ECS cluster, Fargate service, EFS volume, Secrets Manager secrets, security groups, IAM roles, and CloudWatch log groups
- Output a command to retrieve the public IP of the running task

### 4. Get the public IP

After deploy completes, run the command printed in the `GetPublicIp` output, then open:

- **App:** `http://<public-ip>:80`
- **MQ Console:** `https://<public-ip>:9443/ibmmq/console`
  - Username: `admin`
  - Password: value of `ADMIN_PASSWORD` in your `.env`

### 5. Tear down

```bash
npx cdk destroy
```

This removes all AWS resources created by the stack including the ECS cluster, EFS volume, ECR images, Secrets Manager secrets, and CloudWatch log groups.

## What CDK creates automatically

| Resource | Details |
|---|---|
| ECS Cluster | `mqonaws` |
| Fargate Task | 3 containers: `fe`, `be`, `mq` — startup order enforced |
| ECR Repositories | Frontend and backend images (CDK-managed) |
| EFS Filesystem | Persistent MQ storage mounted at `/mnt/mqm` |
| EFS Access Point | uid 1001 / gid 0 for the MQ container |
| Secrets Manager | `mqonaws/app-password`, `mqonaws/admin-password` |
| Security Group | Inbound ports 80, 9443, 1414, 2049 |
| IAM Roles | Task role (EFS access) + execution role (ECR + Secrets Manager) |
| CloudWatch Log Group | `/ecs/mqonaws` — 1 week retention |
