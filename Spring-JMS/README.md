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
`schedules/HeartBeat`. This ensures that when the application is started it continues
to run until interrupted.


You can enable any number of levels.


### Level 101 Sample
The Level 101 sample is the lightest sample, making maximum use of the spring-jms and 
`mq-jms-spring-boot-starter` default boiler plate.

It consists of 3 modules. 
* **MessageConsumer101** - which sets up a listener on destination 2
* **SendMessageService101** - which provides methods to send to destination 1 
* **Scheduler101** - which sets up a scheduler to put or pub two messages every two minutes.

To enable the 101 sample uncomment the `@Component` lines in `MessageConsumer101`
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

### Level 102 Sample
The Level 102 sample show an application that is performing both
put/get point to point messaging as well as pub/sub.

It consists of 4 modules.
* **MQConfiguration102** - which creates two JMS template and two JMS Listener 
  container beans. Configured to allow both put/get and pub/sub. 
* **MessageConsumer102** - which sets up listeners for queue 2 and topic 2.
* **SendMessageService102** - which provides methods to put to queue 1 and publish to topic 1.
* **Scheduler102** - which sets up a scheduler to put and pub a message every two minutes.

To enable the 102 sample uncomment the `@Component` lines in `MessageConsumer102` 
and `SendMessageService102`.

#### Level 102 application.properties
* **app.l102.queue.name1** - Queue name used by the application to put messages.
* **app.l102.queue.name2** - Queue name used by the application to get messages. 
* **app.l102.topic.name1** - Queue name used by the application to publish messages.
* **app.l102.topic.name2** - Queue name used by the application to subscribe to.


### Level 103 Sample
The Level 103 sample shows marshalling of application data objects into and from 
JMS Messages.

It consists of 3 modules.
* **MessageConsumer103** - which sets up listeners for queue 2 for OurData and OurOtherData POJOs.
* **SendMessageService103** - which provides methods to put messages that wrap OurData
  and OurOtherData to queue 1 
* **Scheduler103** - which sets up a scheduler to put messages every two minutes.


To enable the 103 sample uncomment the `@Component` lines in
`MessageConsumer103`
and `SendMessageService103`.

#### Level 103 application.properties
* **app.l103.queue.name1** - Queue name used by the application to put messages.
* **app.l103.queue.name2** - Queue name used by the application to get messages. 

### Level 104 Sample
Whereas the level 103 sample is listening for all messages on queue 2. 
The level 104 sample makes use of message headers as a filter.
The issue with the level 103 sample is that there is an attempt 
to consume all messages, some of which will be rejected when 
marshalling fails.

It consists of 3 modules.
* **MessageConsumer104** - which sets up listeners with selectors for queue 2 
  for OurData and OurOtherData POJOs.
* **SendMessageService104** - which provides methods to put messages that wrap 
  OurData and OurOtherData to queue 1 with additional header information.
* **Scheduler104** - which sets up a scheduler to put messages every two minutes.


To enable the 104 sample uncomment the `@Component` lines in
`MessageConsumer104`
and `SendMessageService104`.


#### Level 104 application.properties
* **app.l104.queue.name1** - Queue name used by the application to put messages.
* **app.l104.queue.name2** - Queue name used by the application to get messages.



### Level 105 Sample
Read as JMS Message

### Level 106 Sample
The Level 106 sample shows non JMS compliance - so can be read 

### Level 107 Samples
Stopping starting listeners

### Level 108 Samples
Connection throtling 