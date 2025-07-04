# IBM MQ Base Java Samples

This project provides a set of base Java samples for interacting with IBM MQ using the IBM MQ classes for Java (non-JMS). These include basic examples for put/get, publish/subscribe, and request/response messaging patterns.

## Samples Included

Each sample is located under:

```
src/main/java/com/ibm/mq/samples/java/
```

- `BasicPut.java` – Puts a message onto a queue  
- `BasicGet.java` – Gets a message from a queue  
- `BasicPub.java` – Publishes a message to a topic  
- `BasicSub.java` – Subscribes and receives messages from a topic  
- `BasicRequest.java` – Sends a message with a dynamic reply-to queue  
- `BasicResponse.java` – Responds to requests received from a queue  

## Prerequisites

- Java 8 or higher  
- Apache Maven  
- IBM MQ installed and running (locally or remotely)  

## Project Setup

This is a standard Maven project. All dependencies and build instructions are managed through `pom.xml`.

### Building the Project

To build the project and download dependencies:

```bash
mvn clean package
```
## Running the Samples

Ensure that your environment configuration file (`env.json`) is properly set up. Example:

```json
{
  "MQ_ENDPOINTS": [
    {
      "QMGR": "QM1",
      "HOST": "localhost",
      "PORT": 1414,
      "CHANNEL": "DEV.APP.SVRCONN",
      "APP_USER": "app",
      "APP_PASSWORD": "passw0rd",
      "QUEUE_NAME": "DEV.QUEUE.1",
      "BACKOUT_QUEUE": "DEV.QUEUE.2",
      "MODEL_QUEUE_NAME": "DEV.APP.MODEL.QUEUE",
      "DYNAMIC_QUEUE_PREFIX": "APP.REPLIES.*",
      "TOPIC_NAME": "dev/"
    }
  ]
}
```
## Using a CCDT File

Instead of manually specifying connection parameters in `env.json`, you can use a **Client Channel Definition Table (CCDT)** JSON file to define connection configurations. This is useful when connecting to IBM MQ instances in cloud or enterprise environments.

Set the environment variable `MQCCDTURL` to point to the CCDT file:

```bash
export MQCCDTURL=file:/absolute/path/to/ccdt.json
```

> **Note (Windows):** Use `set` instead of `export`:
>
> ```cmd
> set MQCCDTURL=file:C:\path\to\ccdt.json
> ```

The sample will detect `MQCCDTURL` and automatically use it for connection settings. When `MQCCDTURL` is set and starts with `file://`, the program prioritizes CCDT-based configuration and skips `host`, `channel`, and `port` in `env.json`.

Make sure your CCDT file defines the appropriate connection information such as **channel name**, **queue manager**, and **connection name list**.


## Run Instructions

### Put/Get

```bash
mvn exec:java -Dexec.mainClass="com.ibm.mq.samples.java.BasicPut" -Dexec.args="env.json"
mvn exec:java -Dexec.mainClass="com.ibm.mq.samples.java.BasicGet" -Dexec.args="env.json"
```

### Publish/Subscribe

In the **first terminal (subscriber)**:

```bash
mvn exec:java -Dexec.mainClass="com.ibm.mq.samples.java.BasicSub" -Dexec.args="env.json"
```

In the **second terminal (publisher)**:

```bash
mvn exec:java -Dexec.mainClass="com.ibm.mq.samples.java.BasicPub" -Dexec.args="env.json"
```

### Request/Response

In the **first terminal (response)**:

```bash
mvn exec:java -Dexec.mainClass="com.ibm.mq.samples.java.BasicResponse" -Dexec.args="env.json"
```

In the **second terminal (request)**:

```bash
mvn exec:java -Dexec.mainClass="com.ibm.mq.samples.java.BasicRequest" -Dexec.args="env.json"
```
### Terminal 1: Run the Request Sample

1. **Compile** the `BasicRequest.java` file using the required JAR dependencies.
2. **Run** the `BasicRequest` class.
3. The requester sends a message and waits for a response.
4. If `REPLY_QUEUE_NAME` is set, that queue is used for replies; otherwise, a temporary queue is created.
5. Optionally, set the `REQUEST_MESSAGE_EXPIRY` environment variable to define how long the request is valid.

---

### Terminal 2: Run the Response Sample

1. **Compile** the `BasicResponse.java` file with the same JAR dependencies.
2. **Run** the `BasicResponse` class.
3. The responder listens on a queue, processes incoming messages, and sends replies to the specified reply-to queue.
4. It continues running until manually stopped or it times out.
5. You can set the `RESPONDER_INACTIVITY_TIMEOUT` environment variable to control how long it waits for new messages before exiting.

---
## Notes

- The environment can be configured using either `env.json` or a CCDT file via the `MQCCDTURL` environment variable.
- Each sample reads from the provided `env.json` to extract connection information for the queue manager.
- Samples like `BasicResponse` and `BasicSub` are long-running and wait for messages indefinitely until stopped.
- Make sure all relevant queues and topics are pre-created in your IBM MQ queue manager.

