# Using Terraform to deploy IBM MQ Queue Manager onto AWS
These .tf files provide a starter set which
can be used to deploy a developer edition IBM MQ Queue Manager
container using Terraform onto AWS ECS.

We have tested this configuration with an id that has AWS `AdministratorAccess` permission.

## AWS CLI
Although you won't need to use it directly, the terraform CLI makes use of your AWS CLI configuration. 
If you have configured the AWS CLI with the AWS Account access key, the terraform commands will be able to access AWS using the configuration. That is, if you have have run `aws configure` from the command line, 
then you do not need to provide AWS access key details to the terraform CLI

## Terraform CLI
Install the Terraform CLI following [this Terraform guide](https://developer.hashicorp.com/terraform/downloads).

## Flavours of configuration
There are two sets of configuration in this repository.
- One Step (no external persistent storage)
  - This is a single set of configuration `.tf` files that can be applied to create 
    - A VPC with 2 private and 2 public subnets
    - A load balancer / firewall in a public subnet
    - An ECS service / task combination with a single container running a queue manager in a private subnet
    - Security groups and network configuration to allow external 443 and 1414 traffic to flow into ports 9443 and 1414 respectively on the container.
    - CloudWatch logs
- Multi Step (with EFS as external persistent storage)
  - This is four sets of configuration `.tf` files that can be applied in sequence to create 
    1. A VPC with 2 private and 2 public subnets
    2. An EFS File system with an access point
    3. A run of `runmqserver -i` to initialise the EFS storage. Once completed the terraform resource should be destroyed, otherwise terraform will keep restarting the process. See below for an explanation and details.
    4. A queue manager as 
      - An ECS service / task combination with a single container running a queue manager in a private subnet 
      - and a load balancer running in a public subnet
      - with xecurity groups and network configuration to allow external 443 and 1414 traffic to flow into ports 9443 and 1414 respectively on the container.
      - and CloudWatch logs.
  

## One Step (no external persistent storage)

### init
Run `terraform init` to download and configure the requisite providers and modules - `aws` and `vpc`.

### variables.tf
This file exposes the customisable parameters. Most come with defaults, but all can be overridden using either command line arguments or envrionment variables. 

The default region is set in this file to `eu-west-2`.

The variables are used as parameters to ensure consistency when the same value is used multiple times in the 
configuration. 

EG. 
- The container name used in the task definition needs to be consistent so that the ECS service can correctly configure the load balancer.
- The log group is paramertized as its usage needs to be consistent throughout the script. Otherwise the queuemanager image will fail on start.

We use `variable` in lieu of `locals` so that the values can be customised when the configuration is applied.

Start up environment parameters for the MQ container image are also specified in the `variables.tf` file.

There are no defaults for `mq_app_password` or `mq_admin_password`, so they must be set on `terraform apply`, either interactively or as `-var` command line parameters. eg.

````
terraform apply -var mq_app_password="AD1ficlutToDeciferAppPassw0rd" -var mq_admin_password="AD1ficlutToDeciferAdminPassw0rd"
````

Other MQ parameters are defaulted to 
````
"LICENSE" = "accept",
"MQ_QMGR_NAME" = "QM1"
````

### platform.tf
This file configures the AWS Terraform provider. For latest
provider version and documentation see [terraform aws doc](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

### main.tf
A new VPC is created and a single IBM MQ Advanced for Developers image is put into a private subnet. 

A Network load balancer is put into a public subnet. The load balancer allows ingress traffic into the ports 443 and 1414 only.

443 traffic is routed to the mq image on port 9443. 1414 traffic is routed to the mq port 1414. 

### mq-container-json.tftpl
Is the container definition template file. 

### outputs.tf
The output from `terraform apply` is the load balancer DNS name.

### apply
Run `terraform apply` to create all the AWS resources needed to run an IBM MQ queuemanager as a service on ECS/Fargate.
You can partially remove some resources, by setting count to `0`. 

eg. 
```` 
resource "aws_ecs_service" "mq-dev-service" {
  count = 0
  ...
}
````

and running `terraform apply`. 

### destroy
Run `terraform destroy` to delete all the AWS resources created.


## Multi Step (with EFS as external persistent storage)
The multi step configuration is forced as the external EFS drive needs to be initialised with the correct directory structure and restrictive access permissions.

### 01 VPC
Steps 1 and 2 could be combined, but we separated them out so that in step 1 only the VPC is created. 

In step 1 all input variables are defaulted, but can be overridden using the standard terraform mechanisms. EG. Environment settings or command line overrides.

The output consists of VPC details. Only the `vpc_id` is needed for subsequent configurations. 

### 02 EFS
Step 2 builds the EFS external file system. It needs 2 inputs:

- region
  which is defaulted to variable `eu-west-2`
- vpc_id
  which must be provided

The EFS and an access point is created.  
Mount targets are created in each of the private subnets, along with a security group, ingress rules and 
permissions to allow access to the storage from the VPC.

The output consists of `efs_id` and `efs_access_point_id`

### 03 MQ EFS Init
Step 3 initialises the EFS storage created in Step 2. 

This step needs 4 inputs 

- region
  which is defaulted to variable `eu-west-2`
- vpc_id
  which must be provided (output from step 1)
- efs_id
  which must be provided (output from step 2)
- efs_access_point
  which must be provided (output from step 2)

eg. 

```
terraform apply -var vpc_id="vpc-123" -var efs_id="fs-456" -var efs_access_point="fsap-789"
```

The storage initialisation is a single task that completes, after which the container terminates. 
Terraform detects that the container has terminated and restarts it. Once the storage has been initialised, ie. you see 

```
Created directory structure under /var/mqm
```

in the logs then the task has been completed. Then either run

`terraform destroy` 

or 

You can partially remove some resources, by setting count to `0` in `main.tf`

eg. 
```
resource "aws_ecs_service" "mq-dev-service" {
  count = 0
  ...
}
```

then running
```
terraform apply -var vpc_id="vpc-123" -var efs_id="fs-456" -var efs_access_point="fsap-789"
```

There are no outputs from this configuration.


### 04 MQ QMgr
This configuration makes use of the VPC created in step 1 and the EFS created in step 2 and initialised in step 3 and creates
  - Security and Target groups that will allow input 
    - 443 and 1414 traffic into the load balancer 
    - 443 and 1414 traffic from the load balancer into the private subnets hosting the queue manager container
    - 9443 and 1414 traffic into the queue manager
  - CloudWatch logging
  - Load balancer acting as a firewall
  - ECS service and task to start up a single container running a queue manager in a private subnet. 

This step needs 4 inputs 

- region
  which is defaulted to variable `eu-west-2`
- vpc_id
  which must be provided (output from step 1)
- efs_id
  which must be provided (output from step 2, initialised in step3)
- efs_access_point
  which must be provided (output from step 2)
 
### terraform destroy
To remove resources that are not being used run 
```
terraform destroy in each of the steps in reverse order. 
```