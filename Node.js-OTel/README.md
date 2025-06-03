# IBM MQ Otel samples for Node.js applications

## Samples
These are cut-down versions of the Node.js patterns in this repo, reworked to allow http requests to initiate put and get requests. Be aware that his code throws randomly exceptions, designed to showcase the OTel trace and metric capabilities of the IBM MQ Client stack.

## Requirements
- Podman or Docker
- Podman compose or Docker compose  

## Configuration
If your queue manager is in the IBM Cloud then we have provided a keystore containing the 
public certificate of the signing certificate authority. If not, and you have TLS enabled on 
your queue manager, then you will need to add the public certificate of either your queue manager or the signing authority's to the key store. 

## Building the containers
```
    podman compose -f docker-compose.yaml build
```

## Running the containers
```
    podman compose -f docker-compose.yaml up
```