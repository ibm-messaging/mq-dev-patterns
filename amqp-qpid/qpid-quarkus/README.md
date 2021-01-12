# Quarkus AMQP QPID to IBM MQ samples
The main class for this sample is `AMQPTester` which determines the mode and options for the run.

The framework for this sample is based on the Quarkus getting started
[USING JMS](https://quarkus.io/guides/jms) guide. The guide app has been replaced
with a sample app that uses the Quarkus QPID AMQP JMS stack to put / get, put / sub
messages to IBM MQ. The difference in the pre-requisites is that for this sample
you need IBM MQ with the AMQP service running.

You don't need to generate the project, just clone the repository and
````
cd mq-dev-patterns/amqp-qpid/qpid-quarkus
````

## MQ Connection properties
The properties that the samples need to connect to MQ are in the
`resources/application.properties` file.

* `quarkus.qpid-jms.url`
  * MQ AMQP URI
    set to `amqp://localhost:5672`
* quarkus.qpid-jms.username
  * MQ app username
* quarkus.qpid-jms.password
  * MQ app password
* `amqp-mqtest.appargs`
  * application mode options
    * see See [qpid samples page](/amqp-qpid/README.md) for the full set of options
* `amqp-mqtest.queuename`
  * queue to use for message put / get
* `amqp-mqtest.topicname`
  * topic to use for message publish / subscribe
* `amqp-mqtest.replyqueuename`
  * reply queue to use when running put / get in request / response mode
    * if omitted reply defaults to using temporary queues.

## Running the sample
To start the sample:
````
mvn compile quarkus:dev
````

## Native executable

### Building native executable
You can build the native GraalVM executable with:
````
mvn package -Pnative
````

### Running native executable
````
./target/mq-dev-patterns-quarkus-0.1.0-runner
````

You can override `application.properties` mode settings by adding the `-Damqp-mqtest.appargs` parameter.

eg. To set the mode to put high priority messages:
````
./target/mq-dev-patterns-quarkus-0.1.0-runner -Damqp-mqtest.appargs=put,high
````
