# IBM MQ Otel samples for Node.js applications
This sample is based on the Node.js (Node.js, serverless and showcase) patterns in this repo. They have been reworked and cutdown, to allow http requests to initiate put and get requests. Otel Instrumentation is optional. 

## Components
There are four components that make up this sample. 
-   *mq* A MQ Server
-   *mqapp* HTTP based Node.js app that listens on `/put` and `get` and invokes MQI API calls.
-   *jaeger* That captures otel traces issued by *mqapp*
-   *prometheus* That captures otel metrics issued by *mqapp* 

## Pre-requsites
We have found that this sample runs best with `podman` and `podman compose`

## *mq*
The docker-compose file uses either `icr.io/ibm-messaging/mq:latest` as the base image or a custom built image when running on MacOS ARM64 eg. `ibm-mqadvanced-server-dev:9.4.2.0-arm64`.

You can create an Apple ARM64 compatible container by following this [blog](https://community.ibm.com/community/user/blogs/richard-coppen/2023/06/30/ibm-mq-9330-container-image-now-available-for-appl)

admin and app passwords are set as secrets from the files `admin-password.txt` and `app-password.txt`

## *mqapp*
The application listens to:
-   `put` 
-   `get`

Both are expecting the following query parameters
-   *QMGR*  Queue Manager
-   *QUEUE* Queue
-   *num* Number of messages to put / get, which if not specified is set to a random number. If the number in the query is > 9 then it is set to a random number < 10

The endpoints can be invoked with curl eg. 

```
curl http://localhost:8080/get?QMGR=QM2&QUEUE=DEV.QUEUE.1
```

### Queue Manager check
The application can interact with a number of queue managers. 
The connection details for each are provided in the `env.json` file.

- *QMGR*
- *QM_HOST*
- *QM_PORT*
- *APP_USER*
- *APP_PASSWORD*
- *CHANNEL*

They can be overriden by envrionment variables for example as set in the `docker-compose.yaml` file

- *QMGR_0*
- *QM_HOST_0*=mq*
- *QM_PORT_0*
- *APP_USER_0*
- *APP_PASSWORD_0*

On receipt of a request there is a check to ensure that the queue manager specified in the request is known. If it is not known a 400 HTTP response is returned. Otherwise a 200 HTTP response is returned. A check is made on `num`, and if not a number, or negative or too high, a randomly generated value is used as a replacement.

The subsequent message logic is run asynchronously after the 200 response has been sent. 

### messaging logic
The underlying Node.js `ibmmq` library is able to detect if the invoking application is using an Otel SDK. 

When it is:

- For outbound messages (MQPUT), the binding looks to see if there is an active OTel trace. If so, it takes the context details and inserts message properties to represent them, if they are not already there. 

The context then passes through the MQ network before being consumed.

- For inbound messages (MQGET), the binding looks for those context properties in the message. If it finds them, and it also finds that there is an active span/trace in the application process, it creates a link from the active span to that context. 

### put logic
The put messaging logic uses the configurable environment variable `ErrorSensitivity` to add a damaged payload to some of the messages sent to the queue. By default this will be 1 in 5

### get logic
The get messaging logic pulls a set of messages and processes them as a group. For every damaged payload it finds it signals an exception to the trace, linking to the origin trace and span information that has been extracted from the context properties in the message.

### Instrumentation
The Otel instrumentation SDK is intialised and started in the file `instrumentation/control.js` 

The trace instrumentation is initialised in `instrumentation/span-trace.js`

The metric instrumentation is initialised in `instrumentation/metrics.js`

### Running the sample application
The application can be started in one of three modes

- `npm run start` which starts up the application without any instrumentation
- `npm run trace` which starts up the application with console only instrumentation
- `npm run export-trace` which starts up the application with Jaeger for tracing and Prometheus for metrics. 

By default the Docker file created for the *mqapp* container starts the applicaion as `export-trace`

## *jaeger*
The application sends tracing information to *jaeger* on `http://jaeger:4318/v1/traces`

The Jaeger UI is available on http://localhost:16686/

Application `/get` traces that detect a damaged message have an associated exception span, for each damaged message detected. The exception span links back to the `/put` trace that delivered the damaged message.

## *prometheus*
*prometheus* scrapes metrics from the *mqapp* from `http://localhost:9464/metrics`

The Prometheus UI is available on `http://localhost:9090/`

*mqapp* makes the following metrics available

- **MQI-sample-app-damaged-message-count** which holds the total number of damaged messages found.
- **MQI_sample_app_damaged_get_request_count_total** which holds the total number of http `/get` actions that found damaged messages. 

Where MQI-sample-app-damaged-message-count >= MQI_sample_app_damaged_get_request_count_total

## Building the containers
Build the containers by running the command:

```
    podman compose -f docker-compose.yaml build
```

## Running the containers
Start the containers by running the command:

```
    podman compose -f docker-compose.yaml up
```
