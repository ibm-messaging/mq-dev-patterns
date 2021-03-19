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


You can enable any number of levels, although multiple message consumers 
may compete with each other.


### Level 101 Sample
**Letting Spring do the work**

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
**An app that does both Point/Point and Pub/Sub**

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
**Data marshalling**

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
**Message Selectors**

Whereas the level 103 sample is listening for all messages on queue 2. 
The level 104 sample makes use of message headers as a selector.
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
**Getting JMS Messages**

The level 105 sample overrides the default Spring marshalling 
and listens for JMS Messages

It consists of 1 module.
* **MessageConsumer105** - which sets up a listener on queue 2.

To enable the 105 sample uncomment the `@Component` line in
`MessageConsumer105`.

#### Level 105 application.properties
* **app.l105.queue.name2** - Queue name used by the application to get messages.

### Level 106 Sample
**Communicating with non-JMS applications**

The Level 106 sample shows how to use a DestinationResolver to
take control of how JMS destinations are created. In this way the 
target client can be set to `WMQConstants.WMQ_CLIENT_NONJMS_MQ`

The sample uses a custom MessageConverter to marshall data objects to and from
json, to use as the JMS TextMessage payload.

It consists of 4 modules.
* **MQConfiguration106** - which creates a non JMS template, setting the MessageConverter and
  the DestinationResolver.
* **MessageConsumer106** - which sets up a string listener for queue 2.
* **SendMessageService106** - which provides methods to put to queue 1.
* **Scheduler106** - which sets up a scheduler to put messages every two minutes.

It also makes use of 2 global modules.
* **OurDesinationResolver** - which creates the destination and sets the target client.
* **OurMessageConverter** - which provides data marshalling to allow desconstruction and
  construction of data objects into and from JSON.
  
To enable the 106 sample uncomment the `@Component` lines in `MessageConsumer106`
and `SendMessageService106`.

#### Level 106 application.properties
* **app.l106.queue.name1** - Queue name used by the application to put messages.
* **app.l106.queue.name2** - Queue name used by the application to get messages.


### Level 107 Sample
**Requesting a response**

The Level 107 sample sends two message requests. For one there is an
asynchronous listener. For the other there is a blocking synchronous wait.

The sample uses a custom MessageConverter to marshall data objects to and from
json, to use as the JMS TextMessage payload.

It consists of 4 modules.
* **MQConfiguration107** - which creates a non JMS template, setting the MessageConverter and
  the DestinationResolver.
* **MessageConsumer107** - which sets up a string listener for the asynchronous response on queue 2.
* **SendMessageService107** - which provides methods to put a requests to queue 1. For 
  the synchronous request, the reply is expected on a temporary queue.
* **Scheduler107** - which sets up a scheduler to put messages every two minutes.


To enable the 107 sample uncomment the `@Component` lines in `MessageConsumer107`
and `SendMessageService107`.

#### Level 107 application.properties
* **app.l107.queue.name1** - Queue name used by the application to put requests.
* **app.l107.queue.name2** - Queue name used by the application to get asynchronous responses.


### Level 108 Sample
**Replying to a request**

The Level 108 sample listens for a request and sends a reply to 
the reply to queue specified in the request. 

The sample uses a custom MessageConverter to marshall data objects to and from
json, to use as the JMS TextMessage payload.

It consists of 2 modules.
* **MessageConsumer108** - which sets up a JMS Message listener for
  the request on queue 2. The correlation from the request is used as the
  correlation in the response.
* **MQConfiguration108** - which sets up a customised listener factory, which 
  sets up reply options.

To enable the 108 sample uncomment the `@Component` lines in `MessageConsumer108`.


#### Level 108 application.properties
* **app.l108.queue.name2** - Queue name used by the application to get requests.


### Level 109 Sample
**Replying to a request with context**

The Level 109 is an alternative to the Level 109 sample. 

The sample doesn't make use of a listener reply, but instead sends a reply
using a JMS template.

It consists of 2 modules.
* **MessageConsumer108** - which sets up a JMS Message listener for the request on queue 2. The correlation from the request is used as the correlation in the response.
* **SendMessageService108** - which provides methods to send a response to the replyto queue. A Spring JmsTemplate is not used as setting setJMSDeliveryMode(DeliveryMode.NON_PERSISTENT), which is required for temporary queues, does not take effect either with JmsTemplate nor with replyTo returns on @JmsListeners.

To enable the 109 sample uncomment the `@Component` 
lines in `MessageConsumer109`.


#### Level 109 application.properties
* **app.l109.queue.name2** - Queue name used by the application to get requests.



### Level 110 Sample
**Permanent reply / audit queues**

The Level 110 sample listens for a request and sends a reply to
a queue set up as an audit of messages received. 

The sample uses a custom MessageConverter to marshall data objects to and from
json, to use as the JMS TextMessage payload.

It consists of 2 modules.
* **MQConfiguration110** - which sets up a customised listener factory, which
  sets up reply options.
* **MessageConsumer110** - which sets up a JMS Message listener for
  the request on queue 2. An audit of the message is sent to queue 3. As 
  a `@SendTo` annotation is used, the audit will get sent to the reply to 
  destination, if one is provided in the incoming request.
  
To enable the 110 sample uncomment the `@Component` 
line in `MessageConsumer110`.


#### Level 110 application.properties
* **app.l110.queue.name2** - Queue name used by the application to get requests.
* **app.l110.queue.name3** - Queue name used by the application to send the audit / reply.


### Level 111 Samples
Connection throttling



### Level 112 Samples
Stopping starting listeners

### Level 201 Samples
MQ Input into DSL Integration Flows

### Level 202 Samples
MQ Input into multiple DSL Channels

### Level 203 Samples
MQ Output from DSL Integration Flows