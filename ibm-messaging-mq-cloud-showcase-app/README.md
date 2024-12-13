# IBM MQ Messaging Playground Application

## Description

A detailed usage of this IBM MQ Messaging Playground Application is provided in the following tutorial: [AWS-TUTORIAL-URL](https://developer.ibm.com/tutorials/mq-build-deploy-ibm-mq-app-to-aws-cloud/). The application is underpinned by three containers (frontend, backend, MQ).

Before deploying the containers, configure the following variables in the `.env` file:

- `APP_PASSWORD`: [the password you want to set for the mq app]
- `ADMIN_PASSWORD`: [the password you want to set for the mq admin]
- `IMAGE_ECS_REGISTRY_URI`: [the URI of your AWS ECS registry OR just a random letter if you are not using the AWS ECS registry]
- `CLUSTER_NAME`: [the AWS ECS cluster name OR just a random letter if you are not using the AWS ECS cluster]

## Environment

There are three different yaml files for deploying the application, depending on the environment.

### AWS Cloud

To deploy the containers on AWS ECS, follow the instructions in the [AWS-TUTORIAL-URL](https://developer.ibm.com/tutorials/mq-build-deploy-ibm-mq-app-to-aws-cloud/).

### Local Machine

To deploy the containers on your local machine (requires docker and docker-compose), run the following commands in your terminal:

    cd mq-dev-patterns/ibm-messaging-mq-cloud-showcase-app/
    docker-compose -f docker-compose.yaml build
    docker-compose -f docker-compose.yaml up
    
After starting the three containers, you can now access:
    - the playground app on the following URL: http://\<your-local-machine-IP>:3000
    - the MQ web console on the following URL: http://\<your-local-machine-IP>:9443/ibmmq/console

#### Running on Apple Silicon (ARM64)

A prebuilt queue manager container for ARM64 isn't available in a container image repository so needs to be built. Follow [this link](https://community.ibm.com/community/user/integration/blogs/richard-coppen/2023/06/30/ibm-mq-9330-container-image-now-available-for-appl) for simplified instructions for building an ARM64 image, which in turn refers to the instructions in the [MQ Container GitHub repo.](https://github.com/ibm-messaging/mq-container/blob/master/docs/building.md)

After building the image you will end up with an image name resembling `ibm-mqadvanced-server-dev:9.4.1.0-arm64` 
To use this image, edit `docker-compose.yaml` and change

````
image: "icr.io/ibm-messaging/mq:latest"
````

to the name of ARM64 image you built. 

````
image: "ibm-mqadvanced-server-dev:9.4.1.0-arm64"
````
