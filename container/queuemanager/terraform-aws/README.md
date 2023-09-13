# Using Terraform to deploy IBM MQ Queue Manager onto AWS
These .tf files provide a starter set which
can be used to deploy an running IBM MQ Queue Manager
container using Terraform onto AWS.

## AWS CLI
Although you won't need to use it directly, underneath you will need the AWS CLI. If you have configured the AWS CLI with the AWS Account access key, the terraform commands will be able to access your credentials. That is, you have have run `aws configure` from the command line.

## init
Run `terraform init` to download and initialise the requisite providers and modules - `aws` and `vpc`

## variables.tf
This file exposes the customisable parameters. Most come with defaults, but all can be overridden using either command line arguments or envrionment variables. 

The default region is set in this file to `eu-west-2`.

Some of the variables are use to ensure consistency.

The container name used in the task definition 
needs to be consistent so that the
ECS service can correctly configure the load balancer.

The log group is paramertized as its usage needs to
be consistent throughout the script. Otherwise the
queuemanager image will fail on start.

Start up envrionment parameters for the MQ container image are also specified in the `variables.tf` file.

There are no defaults for `mq_app_password` or `mq_admin_password`, so they must be set on `terraform apply`. 

Other MQ parameters are defaulted to 
````
"LICENSE" = "accept",
"MQ_QMGR_NAME" = "QM1"
````

## platform.tf
This file configures the AWS Terraform provider.

## main.tf
A new VPC is created and a single IBM MQ Advanced for Developers image is put into a private subnet. 

A Network load balancer is put into a public subnet. The load balancer allows ingress traffic into the ports 443 and 1414 only.

443 traffic is routed to the mq image on port 9443. 1414 traffic is routed to the mq port 1414. 

## mq-container-json.tftpl
Is the container definition template file. 

## outputs.tf
The output from `terraform apply` is the load balancer DNS name.

## apply
Run `terraform apply` to create all the AWS resources needed to run an IBM MQ queuemanager as a service on ECS/Fargate.

## destroy
Run `terraform destroy` to delete all the AWS resources created.
