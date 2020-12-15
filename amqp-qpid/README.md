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
  * [qpid-standard](/qpid-standard/README.md)
  * [qpid-quarkus]((/qpid-quarkus/README.md))
Most of the code is common, and shared through symbolic links. Each has its own
maven `pom.xml` and build and run instructions.

## Run configurations and options
Each set of samples has its own mechanism for configuration.
  * [qpid-standard](/qpid-standard/README.md) uses command line arguments, JNDI and an associated `src/main/resources/jndi.prpperties` file.
  * [qpid-quarkus]((/qpid-quarkus/README.md)) uses
  a quarkus `src/main/resources/application.properties` file

### Mode Options
The mode options are the same for both set of applications. The difference is how
they are specified.

#### [qpid-standard](/qpid-standard/README.md)
Specify as command line arguments, in any order

#### Modes
  * one of
    * put (default)
    * get
    * browse
      * this will run the sample as a put/pub, get/sub or browse. The put will put a set of TextMessage, BytesMessage, StreamMessage,
      ObjectMessage and MapMessage.
  * a integer number n
    * if specified will repeat the put of messages set n times
  * one of
    * queue (default)
    * topic
      * directs the operation to a queue (put/get) or topic (pub/sub)
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
