# AMQP QPID to IBM MQ samples
These use QPID client libraries to publish / subscribe and put / get messages to
topics and queues on IBM MQ.

## AMQP Service in IBM MQ
These samples need the IBM MQ AMQP Service to be running. As the samples use
both queues and topics IBM MQ must be at 9.2.1.0 or above.

### Container Image
To enable the IBM MQ AMQP service in the container image, you will need to customise it.
  * Clone the mq-container [GtiHub repository](https://github.com/ibm-messaging/mq-container)

  * Edit the file `install-mq.sh` and set to enable AMQP

````   
    export genmqpkg_incamqp=1
````

  * Add the contents of `add-dev.mqsc.tpl` from this repository to the bottom of the file `/incubating/mqadvanced-server-dev/10-dev.mqsc.tpl`.

  * Build a developer image following the instructions in the [mq-container repository](https://github.com/ibm-messaging/mq-container/blob/master/docs/building.md)

  * Run the container. If you have tagged your image with `ibm-mqadvanced-server-dev:9.2.1.0-amd64` then you can run it with the command

  ````
  docker run --env LICENSE=accept --env MQ_QMGR_NAME=QM1 --env MQ_APP_PASSWORD=passw0rd --publish 1414:1414 --publish 9443:9443 --publish 5672:5672 --detach ibm-mqadvanced-server-dev:9.2.1.0-amd64
  ````

## AMQP QPID samples
There are two sets of samples.
  * [qpid-standard](/amqp-qpid/qpid-standard/README.md)
  * [qpid-quarkus](/amqp-qpid/qpid-quarkus/README.md)

Most of the code is common, and shared through symbolic links. Each has its own
maven `pom.xml`, build and run instructions.

## Run configurations and options
Each set of samples has its own mechanism for configuration.
  * [qpid-standard](/amqp-qpid/qpid-standard/README.md) uses command line arguments, JNDI and an associated `src/main/resources/jndi.prpperties` file.
  * [qpid-quarkus](/amqp-qpid/qpid-quarkus/README.md) uses
  a quarkus `src/main/resources/application.properties` file

### Mode Options
The mode options are the same for both sets of applications. The difference is in how
they are specified.

#### [qpid-standard](/amqp-qpid/qpid-standard/README.md)
Specify as command line arguments, in any order

#### [qpid-quarkus](/amqp-qpid/qpid-quarkus/README.md)
Specify in `applications.properties` as `amqp-mqtest.appargs`

#### Modes
  * one of
    * put (default)
    * get
    * browse
      * this will run the sample as a put/pub, get/sub or browse. The put will put a set of TextMessage, BytesMessage, StreamMessage,
      ObjectMessage and MapMessage.
      * in MQ 9.2.1.0 browse performs a destructive get on the message
  * an integer number n
    * if specified will repeat the put of messages set n times
  * one of
    * queue (default)
    * topic
      * directs the operation to a queue (put/get) or topic (pub/sub)
  * one of
    * high
    * low
      * if specified sets message priority to high (7) or low (2)
  * one of
    * sync (default)
    * async
      * for the get operations, runs either in synchronous or asynchronous mode
  * selector
    * if set will cause the get to use a selector.
      * causes an exception to be thrown
````
      Exception in thread "main" javax.jms.IllegalStateRuntimeException: The MessageConsumer was closed due to an unrecoverable error.
````  
  * one of
    * if not set defaults the session to AUTO_ACKNOWLEDGE
    * ack
      * if set will switch the session to CLIENT_ACKNOWLEDGE mode.
      * if set for the put, it also needs to be set for the get. Otherwise the get action does not remove the message from the queue.
    * transaction
      * if set will attempt to commit the first 2 messages in each batch put and rollback the remaining 3 messages.
      * causes `createProducer()` in the get to throw an exception
````
      javax.jms.JMSRuntimeException: AMQXR0025E: ClientIdentifier ...
      used an invalid destination name 'null'. [condition = amqp:not-found]
````
  * durable
    * if set will cause the topic subscribe to be durable.
      * needs the mode to be `get topic durable` to be actioned.
  * reply
    * if set the put will add a reply to queue to the message. The put will wait a short time for a response. This setting does
    not directly affect the get. The get does, however check received messages for
    a reply to queue, and if set, sends a reply.
  * expire
    * if specified will run the put with a message expiry.
      * An exception is thrown if the sample is used to get as yet unexpired message with an expiry.  
````      
      javax.jms.JMSRuntimeException: AMQXR2101E:
      ...
      rejected the message because the state of the AMQP message was modified. [condition = amqp:not-implemented]
````     
  * delay
    * if specified will run the put with a message delay
      * Causes an exception to be thrown
````
      javax.jms.JMSRuntimeException: Remote does not support delayed message delivery
````
  * persist
    * if specified will put a persistent message.
  * custom
    * if specified the put adds custom properties to the header.
  * object
    * if specified adds an ObjectMessage to the message set.
      * When specified and running native with GraalVM / Quarkus, causes an Error to be
        thrown
````
com.oracle.svm.core.jdk.UnsupportedFeatureError: ObjectOutputStream.writeObject()
	at com.oracle.svm.core.util.VMError.unsupportedFeature(VMError.java:86)
	at java.io.ObjectOutputStream.writeObject(ObjectOutputStream.java:68)
	at org.apache.qpid.jms.provider.amqp.message.AmqpSerializedObjectDelegate.getSerializedBytes(AmqpSerializedObjectDelegate.java:76)

````
  * bytes
    * if specified adds a BytesMessage to the message set.
      * Raises an exception in MQI get applications
````
      MQ call failed with error : GET: MQCC = MQCC_WARNING [1] MQRC = MQRC_FORMAT_ERROR [2110]
````

In quarkus all get `JMSRuntimeException`s manifest as
````
LogManager error of type FORMAT_FAILURE: Formatting error
java.lang.IllegalArgumentException: can't parse argument number:
````
