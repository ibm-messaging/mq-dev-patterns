# IBM MQ Messaging Playground Application

## Description

A detailed usage of this IBM MQ Messaging Playground Application is provided in the following tutorial: [AWS-TUTORIAL-URL]. The application is underpinned by three containers (frontend, backend, MQ).

Before deploying the containers, configure the following variables in the `.env` file:

- `APP_PASSWORD`: [the password you want to set for the mq app]
- `ADMIN_PASSWORD`: [the password you want to set for the mq admin]
- `IMAGE_ECS_REGISTRY_URI`: [the URI of your AWS ECS registry OR just a random letter if you are not using the AWS ECS registry]
- `CLUSTER_NAME`: [the AWS ECS cluster name OR just a random letter if you are not using the AWS ECS cluster]

## Environment

There are three different yaml files for deploying the application, depending on the environment.

### AWS Cloud

To deploy the containers on AWS ECS, follow the instructions in the [AWS-TUTORIAL-URL].

### Local Machine

To deploy the containers on your local machine (requires docker and docker-compose), run the following commands in your terminal:

    cd mq-dev-patterns/ibm-messaging-mq-cloud-showcase-app/
    docker-compose build
    docker-compose up
    
After starting the three containers, you can now access:
    - the playground app on the following URL: http://<your-local-machine-IP>:3000
    - the MQ web console on the following URL: http://<your-local-machine-IP>:9443/ibmmq/console