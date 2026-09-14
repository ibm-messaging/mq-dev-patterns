# IBM MQ on AWS ECS Fargate — AWS Copilot

This directory contains the files needed to deploy an IBM MQ queue manager on Amazon ECS Fargate using [AWS Copilot CLI](https://aws.github.io/copilot-cli/), as described in the tutorial [Get an IBM MQ queue for development running on AWS Cloud](https://developer.ibm.com/tutorials/mq-connect-app-queue-manager-cloud-aws/).

## Files

| File | Description |
|---|---|
| `mq/manifest.yml` | AWS Copilot service manifest for IBM MQ. Configures an NLB on ports 9443 and 1414 with EFS persistent storage. |
| `iam-policy-copilot-mq-tutorial.json` | Scoped IAM policy covering the exact AWS permissions needed to run the tutorial. |

## Usage

See the full tutorial for step-by-step instructions. In brief:

1. Install [AWS Copilot CLI](https://aws.github.io/copilot-cli/docs/getting-started/install/) and configure the AWS CLI.
2. Ask your AWS administrator to attach `iam-policy-copilot-mq-tutorial.json` to your IAM user:

   ```bash
   aws iam create-policy \
     --policy-name MQCopilotTutorialPolicy \
     --policy-document file://iam-policy-copilot-mq-tutorial.json

   aws iam attach-user-policy \
     --user-name <your-iam-username> \
     --policy-arn arn:aws:iam::<account-id>:policy/MQCopilotTutorialPolicy
   ```

3. Follow the tutorial to initialise the Copilot app and environment, create EFS storage, then deploy using the manifest:

   ```bash
   # After running copilot svc init and creating your EFS resources,
   # copy mq/manifest.yml to copilot/mq/manifest.yml in your working directory,
   # replace YOUR_EFS_ID and YOUR_EFS_AP with your actual IDs, then:
   copilot svc deploy --name mq --env dev
   ```

## License

Apache License 2.0 — see the [LICENSE](../../../LICENSE) file.
