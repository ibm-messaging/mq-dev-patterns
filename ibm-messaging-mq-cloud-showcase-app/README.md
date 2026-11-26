# IBM MQ Messaging Playground Application

## Description

A detailed usage of this IBM MQ Messaging Playground Application is provided in the following tutorial: [AWS-TUTORIAL-URL](https://developer.ibm.com/tutorials/mq-build-deploy-ibm-mq-app-to-aws-cloud/). The application is underpinned by three containers (frontend, backend, MQ).

Before deploying the containers, create your `.env` file from the template and configure the following variables:

    cp .env.example .env

- `APP_PASSWORD`: the password you want to set for the MQ app user
- `ADMIN_PASSWORD`: the password you want to set for the MQ admin user
- `REACT_APP_IS_FOR_CODING_CHALLENGE`: optional, `false` by default. See [Coding challenge mode](#coding-challenge-mode).

`.env` is git-ignored. Do not commit it.

## Environment

### Local Machine (Podman or Docker)

The application runs locally with either Podman or Docker. The commands below use `podman compose`. If you use Docker, replace `podman compose` with `docker compose`. The `docker-compose.yaml` file and the Dockerfiles are the same for both.

> **Note:** `podman compose` (with a space) runs `docker-compose` as its compose provider. Install [Podman Desktop](https://podman.io/) and [docker-compose](https://docs.docker.com/compose/install/) (`brew install podman docker-compose`) if you don't have them yet. It is a different tool from `podman-compose` (with a hyphen). If you use Docker instead, install Docker Engine with the Compose plugin.
>
> On a Mac where `docker` is a link to Podman, `docker compose` still uses Podman. Check with `docker version` that you are talking to a Docker engine.

1. Fill in your passwords in `.env` (created from `.env.example`):

       APP_PASSWORD=<your-app-password>
       ADMIN_PASSWORD=<your-admin-password>

2. Build the images:

       cd mq-dev-patterns/ibm-messaging-mq-cloud-showcase-app/
       podman compose -f docker-compose.yaml build

3. Start all three containers:

       podman compose -f docker-compose.yaml up

4. After all three containers are running:
   - Playground app → http://localhost:3000
   - MQ web console → https://localhost:9443/ibmmq/console

#### Running on Apple Silicon (ARM64)

The IBM MQ image (`icr.io/ibm-messaging/mq:latest`) is `linux/amd64` only. Podman on Apple Silicon will transparently run it under emulation thanks to the `platform: linux/amd64` directive already set in `docker-compose.yaml`. Docker works the same way, provided its engine can run `linux/amd64` containers on Apple Silicon (for example, a Colima VM started with `--arch x86_64`).

The backend image is built as `linux/amd64` as well. With Podman, the `platform: linux/amd64` line in `docker-compose.yaml` only sets the platform of the running container. It does not set the platform of the build, so `backend/Dockerfile` sets it on its `FROM` lines (the `BUILD_PLATFORM` build argument). This is needed because the `ibmmq` npm package has no `linux-arm64` prebuilt binary. Without it, `podman compose build` runs the build as arm64, and `npm ci` stops with `node-gyp: Could not find any Python installation to use`. Building the backend under emulation is slower, so allow several minutes for the first `build`.

##### Optional: run natively on ARM64

If you prefer to run natively and not under emulation, follow [this guide](https://community.ibm.com/community/user/integration/blogs/richard-coppen/2023/06/30/ibm-mq-9330-container-image-now-available-for-appl) to build an ARM64 queue manager image from the [MQ Container GitHub repo](https://github.com/ibm-messaging/mq-container/blob/master/docs/building.md). The backend also needs an ARM64 IBM MQ C client library and a compiler toolchain, because the `ibmmq` package only downloads the library automatically on Linux x64 and Windows.

1. In `docker-compose.yaml`, replace the `mq` image with the ARM64 image you built, and delete the `platform: linux/amd64` line from **both** the `mq` and `be` services:

   ```yaml
   image: "localhost/ibm-mqadvanced-server-dev:10.0.0.0-arm64"
   ```

2. In `backend/Dockerfile`, install a compiler toolchain in the builder stage, replacing the `npm ci` line:

   ```dockerfile
   RUN apt-get update && apt-get install -y python3 make g++ --no-install-recommends && rm -rf /var/lib/apt/lists/* && npm ci --omit=dev
   ```

   In the runtime stage, after `COPY --from=builder ...`, copy the MQ C client library from the ARM64 image:

   ```dockerfile
   COPY --from=localhost/ibm-mqadvanced-server-dev:10.0.0.0-arm64 /opt/mqm/lib64 /opt/mqm/lib64
   COPY --from=localhost/ibm-mqadvanced-server-dev:10.0.0.0-arm64 /opt/mqm/lib /opt/mqm/lib
   COPY --from=localhost/ibm-mqadvanced-server-dev:10.0.0.0-arm64 /opt/mqm/msg /opt/mqm/msg
   COPY --from=localhost/ibm-mqadvanced-server-dev:10.0.0.0-arm64 /opt/mqm/gskit9 /opt/mqm/gskit9
   ```

3. Build the backend for ARM64 and start:

   ```bash
   podman compose -f docker-compose.yaml down -v
   podman compose -f docker-compose.yaml build --build-arg BUILD_PLATFORM=linux/arm64 be
   podman compose -f docker-compose.yaml up -d
   ```

### Coding challenge mode

The coding challenge turns the application into the University Donations app. To enable it, set the following in your `.env` file:

    REACT_APP_IS_FOR_CODING_CHALLENGE=true

The setting applies to the local dev server, containers and AWS. It is built into the frontend, so rebuild or restart after changing it. Any value other than `true` shows the standard ticket-booking demo.

### Frontend tests

The frontend uses [Vitest](https://vitest.dev/), React Testing Library and jsdom. Run the commands from `frontend/AWS-MQ-showcase`:

Run the full suite once:

    npm test

Re-run tests when files change:

    npm run test:watch

Run the suite and write a coverage report (terminal summary and `coverage/index.html`):

    npm run test:coverage

Type-check the project, including test files:

    npm run typecheck

Check Prettier formatting:

    npm run format:diff

Test files live next to the code they cover and match `src/**/*.test.{ts,tsx}`. Shared setup is in `src/test/setup.ts`, and `src/test/utils.tsx` provides `renderWithRouter` for components that use routing.

Use Node.js 22.22.2 or later (24.15.0 or later, or 26.x). The repository `.nvmrc` pins v26.6.0, so run `nvm use` before installing dependencies.

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

To deploy in [coding challenge mode](#coding-challenge-mode), set `REACT_APP_IS_FOR_CODING_CHALLENGE=true` in the root `.env` before `npx cdk deploy`.

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

### AWS Cloud (Terraform)

The `terraform/` directory deploys the same three-container application to AWS ECS Fargate as an alternative to the CDK stack above. Use one or the other per AWS account and region, not both: they use the same resource names, so the second deployment fails on names that already exist.

One `terraform apply` builds and pushes the frontend and backend images, then creates the network rules, EFS storage, secrets, Network Load Balancer and a single ECS task running all three containers.

#### Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) 1.11 or later
- AWS CLI configured (`aws configure`). There is no bootstrap step, so your own credentials need permission to create IAM roles, Secrets Manager secrets, and the ECS, EFS, ECR and load balancer resources.
- Podman (default) or Docker, plus `bash`, to build and push the images. Set `container_cli = "docker"` to use Docker.

#### Configure

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Set `app_password` and `admin_password` in `terraform.tfvars`. The file is git-ignored, so never commit it. Alternatively, export `TF_VAR_app_password` and `TF_VAR_admin_password`.

Other inputs have defaults (see `terraform/variables.tf`), for example `region` (`us-west-1`) and `mq_image`.

> **Security:** by default, `allowed_ingress_cidr` is `0.0.0.0/0`, so the application (port 80) and the MQ console (port 9443) are reachable from any address. Set it to your own range, for example `"203.0.113.4/32"`, before sharing the URL. MQ port 1414 is not exposed.

#### Deploy

```bash
terraform init
terraform plan
terraform apply
```

Terraform prints three outputs (run `terraform output` to see them again):

- `app_url`: the Messaging Playground
- `mq_console_url`: the IBM MQ web console (HTTPS on 9443)
- `nlb_dns_name`: the load balancer address

The first start can take a while, because ECS ignores health checks for 300 seconds to give MQ time to come up. The service runs one task, since MQ locks its storage, so an update causes a short gap.

#### State

State is a local file, `terraform/terraform.tfstate`, which is git-ignored. If you lose it, the AWS resources stay in place but Terraform no longer knows them. For shared use, configure a remote backend. The MQ passwords are write-only attributes and are not stored in state, but the file still holds resource IDs and settings, so treat it as sensitive.

#### Tear down

```bash
terraform destroy
```

This removes everything Terraform created, including the ECR repositories and the secrets (deleted immediately, with no recovery window). The default VPC and subnets are only looked up, so they stay.
