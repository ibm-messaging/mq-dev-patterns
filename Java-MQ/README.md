# IBM MQ Classes for Java Samples

This project provides a set of samples for interacting with IBM MQ using the IBM MQ classes for Java (non-JMS). These
include examples for put/get, publish/subscribe, and request/response messaging patterns.

## Notes on the Classes for Java (aka MQ Base Java classes)

This is not the place for a detailed comparison between the base classes and JMS, but it is worth considering a few
points.

These classes are a lot closer to the underlying MQI functions than JMS. Although they are an object-oriented set of
classes, and follow typical Java patterns, they do not provide the same abstraction options as the JMS API. You can see
that in classes such as MQPutMessageOptions and MQGetMessagOptions which correspond directly to the MQPMO and MQGMO
structures.

While these classes continue to be supported, they have been functionally stabilised for several years. That means that
newer capability provided in MQ may not be accessible through the Base Classes methods. For example, you cannot use the
JWT authentication mechanism.

Most Java applications should use the JMS API. But there can be times when more direct control of the MQ operations are
required, and therefore you might prefer to use the Base Classes.

These samples are provided as a starting point for such applications.

## Samples

There are six basic patterns implemented as pairs in these samples: put/get, publish/subscribe and request/response. They share a
common set of classes to read the configuration and handle the connection to the queue manager. And there are other
classes shared between similar operations to reduce duplication further.

The core classes will usually be used in pairs. They are:

* **BasicPut.java** - Puts messages onto a queue
* **BasicGet.java** - Gets messages from a queue
* **BasicPub.java** - Publishes messages to a topic
* **BasicSub.java** - Subscribes to messages from a topic
* **BasicRequest.java** - Puts a request message and waits for a reply
* **BasicResponse.java** - Waits for a request message and sends the reply

There are then additional modules to provide shared functions. They include:

* **EnvSetter.java** - Used to read settings from a configuration file or from system properties
* **BasicMQFunctions.java** - Manages the connection to the queue manager
* **BasicConsumer.java** - Consumes messages from a queue or publications from a topic
* **BasicProducer.java** - Sends messages either to a queue or publications to a topic
* **BasicLogger.java** - Implements a simple log strategy to report progress

## Prerequisites

* Java 17 or higher
* Apache Maven
* IBM MQ installed and running (locally or remotely)

## Project Setup

This is a standard Maven project. All dependencies and build instructions are managed through `pom.xml`.

### Building the Project

A _pom.xml_ file is provided allowing you to use maven to download dependencies and build the samples. The simplest
execution will create a single jar file containing all the dependencies, ready to run directly.

```
mvn clean package
```

## Running the Samples

Ensure that your environment configuration file (`env.json`) is properly set up.

You can then run the programs, specifying which of the 6 operations you want. Optionally nominate a configuration file
as well. For example:

````
java -DEnvFile=../env.json -cp target/base-mq-java-1.0.0.jar com.ibm.mq.samples.java.BasicPut
````

Output is logged in the console, including the configuration that has been read:
```
[13:09:54] [INFO   ] EnvSetter           : MQDetails [QMGR=QM1, QUEUE_NAME=DEV.QUEUE.1, HOST=127.0.0.1,
      PORT=1413, CHANNEL=DEV.APP.SVRCONN,
      USER=app, KEY_REPOSITORY=, CIPHER=,
      MODEL_QUEUE_NAME=DEV.APP.MODEL.QUEUE,
      DYNAMIC_QUEUE_PREFIX=APP.REPLIES.*, TOPIC_NAME=dev/]
[13:09:54] [INFO   ] BasicPut            : Will try to put 2 messages
[13:09:54] [INFO   ] BasicMQFunctions    : Connected to queue manager: QM1
[13:09:55] [INFO   ] BasicMQFunctions    : Queue opened: DEV.QUEUE.1
[13:09:55] [INFO   ] BasicProducer       : Message sent: 13:09:55 : Message sent from BasicPut
[13:09:56] [INFO   ] BasicProducer       : Message sent: 13:09:56 : Message sent from BasicPut
...

```

All of the _main_ entrypoints are in the same jar file, so it is just a matter of giving the correct class name to
execute.

### Put/Get
The put/get programs can have a single parameter saying how many messages to send or to attempt to receive.

For example, to put 6 messages run:
````
java -cp target/base-mq-java-1.0.0.jar com.ibm.mq.samples.java.BasicPut 6
````

To get the messages run:
````
java -cp target/base-mq-java-1.0.0.jar com.ibm.mq.samples.java.BasicGet 6
````

### Publish / Subscribe
You have to run the subscriber sample first so it creates a subscription and waits for a publication.

Open two terminals.

In the first terminal:
````
java -cp target/base-mq-java-1.0.0.jar com.ibm.mq.samples.java.BasicSub
````

Then run the publisher sample is the other terminal:
````
java -cp target/base-mq-java-1.0.0.jar com.ibm.mq.samples.java.BasicPub
````

### Request / Response
You have to run the responder sample first, so it is waiting for the request message.

Open two terminals.

In the first terminal;
````
java -cp target/base-mq-java-1.0.0.jar com.ibm.mq.samples.java.BasicResponse
````

In the second terminal:
````
java -cp target/base-mq-java-1.0.0.jar com.ibm.mq.samples.java.BasicRequest
````


