# IBM MQ Otel samples for Node.js applications

## Samples
These are cut-down versions of the Node.js patterns in this repo, reworked to allow http requests to initiate put and get requests.

## Requirements
- Podman or Docker
- Podman compose or Docker compose  

## Building the containers
```
    podman compose -f docker-compose.yaml build
```

## Running the containers
```
    podman compose -f docker-compose.yaml up
```