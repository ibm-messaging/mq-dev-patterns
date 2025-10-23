# IBM Java-MQ Samples

This project provides a set of base Java samples for interacting with IBM MQ using the IBM MQ classes for Java (non-JMS). These include basic examples for put/get, publish/subscribe, and request/response messaging patterns.

## Samples Included

Each sample is located under:

```
src/main/java/com/ibm/mq/samples/java/
```

- `BasicPut.java` – Puts a message onto a queue  
- `BasicGet.java` – Gets a message from a queue  
- `BasicPub.java` – Publishes a message to a queue (persisted publish)  
- `BasicSub.java` – Subscribes and receives messages from a queue  
- `BasicRequest.java` – Sends a message with a dynamic reply-to queue  
- `BasicResponse.java` – Responds to requests received from a queue  
- `BasicProducer.java` – Produces a message to a queue (used by request wrappers)  
- `BasicConsumer.java` – Consumes a message from a queue (used by request/response logic)  
- `MQDetails.java` – POJO to hold MQ connection configuration  
- `SampleEnvSetter.java` – Utility to parse `env.json` and load MQ endpoint configurations  
- Wrapper Classes (used internally for iterating over endpoints):  
  - `BasicPutWrapper.java`  
  - `BasicGetWrapper.java`  
  - `BasicPubWrapper.java`  
  - `BasicSubWrapper.java`  
  - `BasicRequestWrapper.java`  
  - `BasicResponseWrapper.java`  

> **Note**: Wrapper classes are utility helpers and should not be run directly.
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

Ensure that your environment configuration file (`env.json`) is properly set up.

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
All samples should be run using the following format:
```bash
mvn exec:java \
  -Dexec.mainClass="com.ibm.mq.samples.java.<ClassName>" \
  -Dexec.args="-Dcom.ibm.mq.cfg.jmqiDisableAsyncThreads=true" \
  -Dexec.jvmArgs="-DENV_FILE=./env.json"
```
### Put
The number at the end of args is the number of messages you want to put to the queue, to change the number of message you put, simply change the number at the end of the argument.

```bash
mvn exec:java \
  -Dexec.mainClass="com.ibm.mq.samples.java.BasicPut" \
  -Dexec.args="-Dcom.ibm.mq.cfg.jmqiDisableAsyncThreads=true 5" \
  -Dexec.jvmArgs="-DENV_FILE=./env.json"
```
### Get
The number at the end of args is the number of messages you want to get from the queue, to change the number of message you get, simply change the number at the end of the argument.

```bash
mvn exec:java \
  -Dexec.mainClass="com.ibm.mq.samples.java.BasicGet" \
  -Dexec.args="-Dcom.ibm.mq.cfg.jmqiDisableAsyncThreads=true 5" \
  -Dexec.jvmArgs="-DENV_FILE=./env.json"
```

### Publish/Subscribe

**First terminal (subscriber):**

```bash
mvn exec:java \
  -Dexec.mainClass="com.ibm.mq.samples.java.BasicSub" \
  -Dexec.args="-Dcom.ibm.mq.cfg.jmqiDisableAsyncThreads=true" \
  -Dexec.jvmArgs="-DENV_FILE=./env.json"
```

**Second terminal (publisher):**

```bash
mvn exec:java \
  -Dexec.mainClass="com.ibm.mq.samples.java.BasicPub" \
  -Dexec.args="-Dcom.ibm.mq.cfg.jmqiDisableAsyncThreads=true" \
  -Dexec.jvmArgs="-DENV_FILE=./env.json"
```

### Request/Response

**First terminal (response):**

```bash
mvn exec:java \
  -Dexec.mainClass="com.ibm.mq.samples.java.BasicResponse" \
  -Dexec.args="-Dcom.ibm.mq.cfg.jmqiDisableAsyncThreads=true" \
  -Dexec.jvmArgs="-DENV_FILE=./env.json"
```

**Second terminal (request):**

```bash
mvn exec:java \
  -Dexec.mainClass="com.ibm.mq.samples.java.BasicRequest" \
  -Dexec.args="-Dcom.ibm.mq.cfg.jmqiDisableAsyncThreads=true" \
  -Dexec.jvmArgs="-DENV_FILE=./env.json"
```

## Notes

- The environment can be configured using either `env.json` or a CCDT file via the `MQCCDTURL` environment variable.
- Samples like `BasicResponse` and `BasicSub` are long-running and wait for messages until terminated or a timeout occurs.
- **Wrapper classes** are designed to iterate over all endpoints in `env.json`, but are not meant to be executed directly from the command line.
- Make sure all relevant queues and topics are pre-created in your IBM MQ queue manager.