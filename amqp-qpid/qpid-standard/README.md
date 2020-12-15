# Standard AMQP QPID to IBM MQ samples

## MQ Connection properties
The properties that the samples need to connect to MQ are in the
`resources/jndi.properties` file.

* `java.naming.factory.initial`
  * the InitialContextFactory class
    * set to `org.apache.qpid.jms.jndi.JmsInitialContextFactory`

* `connectionfactory.myFactoryLookup`
  * ConnectionFactory URI
    * set to `amqp://localhost:5672`

* `jms.username`
  * MQ app username

* `jms.password`
  * MQ app password

* `queue.myQueueLookup`
  * queue to use for message put / get

* `topic.myTopicLookup`
  * topic to use for message publish / subscribe

* `queue.myReplyQueueLookup`
  * reply queue to use when running put / get in request / response mode
    * if left blank reply defaults to using temporary queues.

## Building the sample application jar
A maven `pom.xml` is provided allowing you to use maven to download dependancies and build the sample. You can build the samples by running the command.

````
mvn clean package
````

### Running sample.
The main class in the uber jar is `com.ibm.mq.samples.jms.qpid.JMS20Tester`, which will run the sample in a put / get, request / response and pub / sub samples.

To run:

````
java -jar /target/mq-dev-patterns-qpid-0.1.0.jar
````

Command line arguments can be used to control the sample mode. eg. for a request, run  

````
java -jar /target/mq-dev-patterns-qpid-0.1.0.jar put reply
````

See [qpid samples page](/amqp-qpid/README.md) for the full set of options
