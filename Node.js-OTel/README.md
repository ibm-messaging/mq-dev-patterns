# IBM MQ Otel samples for Node.js applications

## Samples
These samples are based on the Node.js (Node.js, serverless and showcase) patterns in this repo, reworked and cutdown, to allow http requests to initiate put and get requests. Be aware that his code throws randomly exceptions, designed to showcase the OTel trace and metric capabilities of the IBM MQ Client stack.

## Requirements
- Podman or Docker
- Podman compose or Docker compose  

## Configuration
If your queue manager is in the IBM Cloud then we have provided a keystore containing the 
public certificate of the signing certificate authority. If not, and you have TLS enabled on 
your queue manager, then you will need to add the public certificate of either your queue manager or the signing authority's to the key store. 

## Building the containers
I built and tested the containers on a Apple ARM64 machine and so created a custom MQ container following this [blog](https://community.ibm.com/community/user/blogs/richard-coppen/2023/06/30/ibm-mq-9330-container-image-now-available-for-appl)

```
    podman compose -f docker-compose.yaml build
```

## Running the containers
```
    podman compose -f docker-compose.yaml up
```