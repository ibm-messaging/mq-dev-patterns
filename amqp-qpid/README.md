# AMQP QPID to IBM MQ samples
These use QPID client libraries to publish / subscribe and put / get messages to
topics and queues on IBM MQ.

## AMQP Service in IBM MQ
These samples need the IBM MQ AMQP Service to be running. As the samples use
both queues and topics IBM MQ must be at 9.2.1.0 or above.

### Container Image
To enable the IBM MQ AMQP service in the container image, you will need to customise it.
  . Clone the mq-container [GtiHub repository](https://github.com/ibm-messaging/mq-container)

  . Edit the file `install-mq.sh` and set to enable AMQP

    ````   
    export genmqpkg_incamqp=1
    ````

  . Add the contents of `add-dev.mqsc.tpl` from this repository to the bottom of the file `/incubating/mqadvanced-server-dev/10-dev.mqsc.tpl`.

  . Build a developer image following the instructions in the [mq-container repository](https://github.com/ibm-messaging/mq-container/blob/master/docs/building.md)

  . Run the container. If you have tagged your image with `ibm-mqadvanced-server-dev:9.2.1.0-amd64` then you can run it with the command

  ````
  docker run --env LICENSE=accept --env MQ_QMGR_NAME=QM1 --env MQ_APP_PASSWORD=passw0rd --publish 1414:1414 --publish 9443:9443 --publish 5672:5672 --detach ibm-mqadvanced-server-dev:9.2.1.0-amd64
  ````

## AMQP QPID samples
There are two sets of samples.
  . [qpid-standard](/qpid-standard/README.md)
  . [qpid-quarkus]((/qpid-quarkus/README.md))
Most of the code is common, and shared through symbolic links. Each has its own
maven `pom.xml` and build and run instructions.

## Run configurations and options
Each set of samples has its own mechanism for configuration.
  . [qpid-standard](/qpid-standard/README.md) uses command line arguments, JNDI and an associated `src/main/resources/jndi.prpperties` file.
  . [qpid-quarkus]((/qpid-quarkus/README.md)) uses
  a quarkus `src/main/resources/application.properties` file

### Options
The options are the same
