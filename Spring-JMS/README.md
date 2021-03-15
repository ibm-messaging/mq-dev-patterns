# IBM MQ Spring JMS samples

## Running the samples
To start the application, navigate to the `Spring-JMS` directory and run

`mvn clean install spring-boot:run`

This will build and run the application. Once built the application can be rerun without rebuilding by running

`java -jar target/mq-spring-0.0.1-SNAPSHOT.jar`

## application.properties
This file found in the `resources` directory contains both MQ and Application settings.

### MQ Settings
The following settings are required for MQ
* **ibm.mq.queueManager** - Queue manager name 
* **ibm.mq.channel** - MQ Channel name 
* **ibm.mq.connName** - Host(Port) for the queue manager. eg `localhost(1414)`
* **ibm.mq.user** - User name that the application uses to connect to MQ
* **ibm.mq.password** - Password that application uses to connect to MQ

### Application Settings
The following setting are required for MQ


## Levels
The application is split into level packages,
starting from the simple no customisation needed in level101,
and increasing in complexity and customisation working up the levels.

Each sample level is initially disabled. The only component that is initially enabled is
`schedules/HeartBeat`. This ensures that when the application is started then

You can enable any number of levels.


### Level 101 Samples
The Level 101 samples are the lightest samples, making maximum use of the spring-jms and 
`mq-jms-spring-boot-starter` default boiler plate.

It consists of 3 modules. 
* **MessageConsumer101** - which sets up a listener on destination 2
* **SendMessageService101** - which provides methods to send to destination 1 
* **Scheduler101** - which sets up a scheduler to put or pub two messages every two minutes.

To enable the 101 samples uncomment the `@Component` lines in `MessageConsumer101`
and `SendMessageService101`.


#### Level 101 application.properties
* **app.l101.dest.name1** - Queue name used by the application to put messages. This will become 
  the publication topic when running in default pub/sub mode.

* **app.l101.dest.name2** - Queue name used by the application to get messages. This will become 
  the subscription topic names when runninbg in default pub/sub mode.
  
Switch to running in default pub/sub mode by setting
````
spring.jms.pub-sub-domain=true
````


