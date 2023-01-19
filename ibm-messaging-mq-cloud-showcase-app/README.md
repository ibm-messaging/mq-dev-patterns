IBM MQ MESSAGING PLAYGROUND APPLICATION

All the instructions to deploy the three containers and to use the MQ playground app are available here: 

---Important---
To be able to run the application you need to configure the variables within the .env file.
APP_PASSWORD= [the password you want to set for the mq app]
ADMIN_PASSWORD= [the password you want tot set for admin the mq app]
IMAGE_ECS_REGISTRY_URI= [the URI of your AWS ECS registry OR just a random letter if you are not using AWS ECS]
CLUSTER_NAME= [the AWS ECS cluster name OR just a random letter if you are not using AWS ECS]