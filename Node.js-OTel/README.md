# IBM MQ Otel samples for Node.js applications

## Samples
These samples are based on the Node.js (Node.js, serverless and showcase) patterns in this repo, reworked and cutdown, to allow http requests to initiate put and get requests. Be aware that his code throws randomly exceptions, designed to showcase the OTel trace and metric capabilities of the IBM MQ Client stack.

The samples shows how to add instrumentation to applications mixing synchronous HTTP requests that need to respond quickly
with longer running asynchronous logic.

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

## Jaeger
The Jaeger UI can be accessed on `http://localhost:16686/`

## Application endpoints
The application exposes two `GET` http urls. 

-  **/put** which accepts `QMGR`, `QUEUE` and `num` as parameters. 
-  **/get** which accepts `QMGR`, `QUEUE` and `num` as parameters. 

For both a check is made to ensure that the `QMGR` specified is known. If not then a 400 error is returned. A check is made on `num`, and if not a number, or negative or two high, a randomly generated value is used as a replacement. A 200 is returned, and asynchronously the code will then put /  get `num` messages to / from the appropriate `QUEUE` on the specified `QMGR`. If an error is detected, then that is only recorded in the logs, and Otel instrumentation.

