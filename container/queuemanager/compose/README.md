# Using Docker Compose to deploy IBM MQ Queue Manager
These yaml and .env files provide a starter set which
can be used to deploy an running IBM MQ Queue Manager
container using Docker Compose.

## Deploy to the Cloud
How to use Docker Compose to deploy to the cloud is documented in
the [Docker overview](https://docs.docker.com/get-started/overview/)

### AWS ECS Policies
[The Docker Compose documentation](https://docs.docker.com/cloud/ecs-integration/)
lists the AWS IAM permissions needed for Docker Compose to manage AWS resources.
Please check with the Docker (AWS ECS) Compose documentation for updates on the required policies.

We used the following coarse grained IAM permissions. `VisualEditor0`, denotes that we built the policies using the visual editor. You can merge these policies into logical units, but for clarity we have presented them separately.

**Note:** You may wish to restrict the policies
further to your specific needs to ensure you have an optimal configuration.


#### System policies
These are AWS managed policies that you don't need to write yourself. We used the following
AWS managed system policies:
- ElasticLoadBalancingFullAccess
- AmazonECS_FullAccess
- AmazonEC2FullAccess
- IAMFullAccess
- AWSCloudFormationFullAccess


#### User defined policies
These are permissions for which we didn't find suitable AWS managed policies, so had to hand
create them. 
#### logs
```{javascript}
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "logs:*",
            "Resource": "*"
        }
    ]
}
```

#### Service Discovery
```{javascript}
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "servicediscovery:*",
            "Resource": "*"
        }
    ]
}
```

#### Route53
```{javascript}
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "route53:CreateHostedZone",
                "route53:GetHostedZone",
                "route53:GetHealthCheck",
                "route53:DeleteHostedZone",
                "route53:ListHostedZonesByName"
            ],
            "Resource": "*"
        }
    ]
}
```

#### Application Autoscaling
```{javascript}
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "application-autoscaling:*",
            "Resource": "*"
        }
    ]
}
```

#### EFS (Additional to enable persistent storage)
```{javascript}
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "elasticfilesystem:*",
            "Resource": "*"
        }
    ]
}
```

#### ECR 
This is an additional policy needed to deploy the showcase application and 
grants permission to use AWS Elastic Container Registry to store showcase container images.
```{javascript}
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "ecr:*",
            "Resource": "*"
        }
    ]
}
```

## External Storage
External storage will allow queues, persistent messages,
and logs to persist across container outages.

Initialise the external storage by running

````
docker compose -f mq-init-compose.yaml up
````

The container will start, initialise the storage, and then stop.

## App and Admin credentials
The App and Admin use credentials are held in the `.env` file. Edit the file to set the passwords.

## Queue Manager
Start the queue manager by running

````
docker -f docker-compose.yaml up
````

If you see the start fails with the following error:

````
WARNING The "APP_PASSWORD" variable is not set. Defaulting to a blank string.
WARNING The "ADMIN_PASSWORD" variable is not set. Defaulting to a blank string.
````

then you have not set the App and Admin passwords in the `.env` file.

## Stopping the container
Stop the queue manager container by running

````
docker -f docker-compose.yaml down
````
