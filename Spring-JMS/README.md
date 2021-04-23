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
* **ibm.mq.tempModel** - Model name for temporary reply queues 

### Spring Settings
The following setting is set
* **spring.main.web-application-type=none** - To ensure that no web components are started

The following are provided as commented out examples to use as directed
by the samples.

* **spring.jms.pub-sub-domain=true** - Set to true to enable pub/sub by default
* **spring.jms.listener.auto-startup=false** - Set to true to prevent listener containers automatically starting on startup.


## Levels
The application is split into level packages,
starting from the simple no customisation needed in level101,
and increasing in complexity and customisation working up the levels.

Each sample level is initially disabled. The only component that is initially enabled is
`schedules/HeartBeat`. This ensures that when the application is started it continues
to run until interrupted.


You can enable any number of levels, although multiple message consumers 
may compete with each other.

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

### Level 109 Sample
**Replying to a request with context**

The Level 109 is an alternative to the Level 108 sample. 

The sample doesn't make use of a listener reply, but instead sends a reply
using a JMS template.

It consists of 2 modules.
* **MessageConsumer109** - which sets up a JMS Message listener for the request on queue 2. The correlation from the request is used as the correlation in the response.
* **SendMessageService109** - which provides methods to send a response to the replyto queue. A Spring JmsTemplate is not used as setting setJMSDeliveryMode(DeliveryMode.NON_PERSISTENT), which is required for temporary queues, does not take effect either with JmsTemplate nor with replyTo returns on @JmsListeners.

To enable the 109 sample uncomment the `@Component` 
lines in `MessageConsumer109`.

#### Level 109 application.properties
* **app.l109.queue.name2** - Queue name used by the application to get requests.

---

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

---

### Level 111 Sample
**Concurrency and throttling** 

The Level 111 sample sets up a single listener with concurrency set to 
minimum of 2 and maximum of 3. Each cycle pauses to lock the current thread,
during which new threads could be launched.

It consists of 1 modules.
* **MessageConsumer111** - which sets up a JMS Message listener for
  the request on queue 2. 

To enable the 111 sample uncomment the `@Component`
line in `MessageConsumer111`.

#### Level 111 application.properties
* **app.l111.queue.name2** - Queue name used by the application to get messages.

---

### Level 112 Sample
**Stop and start of listeners**

The Level 112 sample sets up a single listener and a scheduler that once a 
minute checks the status of the listener, and toggles its state between 
running and stopped. 

If you want the listener status to be stopped at startup then uncomment the line

````
spring.jms.listener.auto-startup=false
````

in `application.properties`.

It consists of 2 modules.
* **MessageConsumer112** - which sets up a JMS Message listener for
  the request on queue 2.
* **Scheduler112** - which once a minute checks the status of the 112 
  listener and toggles its status.

To enable the 112 sample uncomment the `@Component`
lines in `MessageConsumer112` and `Scheduler112`.

#### Level 112 application.properties
* **app.l112.queue.name2** - Queue name used by the application to get messages.

---

### Level 113 Sample
**Registering Listeners**

The Level 113 sample makes use of `JmsListenerEndpointRegistrar` 
to register its own message listener. 

It consists of 1 module.
* **MQConfiguration113** - which creates an registers a listener on  queue 2.

To enable the 113 sample uncomment the `@Configuration`
line in `MQConfiguration113`. 
*Note*: The configuration registrers a listener, which may compete with
listeners in other samples. If you don't want this listener to consume
messages, then the `@Configuration` must be disabled.

#### Level 113 application.properties
* **app.l113.queue.name2** - Queue name used by the application to get messages.

---

### Level 114 Sample
**Custom connection beans**

The Level 114 sample creates a custom connection factory. Have two or more custom
factories allows an application to create connections to multiple MQ 
host / port / channel combinations.

It consists of 4 modules.
* **MQConfiguration114** - which creates a custom connection factory, which 
  in turn is used by the listener and JMS Template.
* **MessageConsumer114** - which sets up a listener on queue 2.
* **SendMessageService114** - which provides a method to put a requests to queue 1. 
* **Scheduler114** - which sets up a scheduler to put messages every two minutes.

To enable the 114 sample uncomment the `@Component` lines in `MessageConsumer114`
and `SendMessageService114` and the `@Configuration` line in
`MQConfiguration114`.

#### Level 114 application.properties
* **app.l114.queue.name1** - Queue name used by the application to put messages.
* **app.l114.queue.name2** - Queue name used by the application to get messages.

---

### Level 115 Sample
**Backout Threshold**

The Level 115 sample queries and logs the back out threshold for a queue.

It consists of 2 modules.
* **MQConfiguration115** - which creates a custom MQQueueManager using 
  admin credentials and an admin channel 
* **CmdRunner115** - which runs a queue inquiry using the custom MQQueueManager to 
  log the queues backout threshold and backout queue name. 
  
The sample also makes use of `MQAdminProperties` to read app admin properties 
from appliation.properties.

To enable the 115 sample uncomment the `@Component` line in `CmdRunner115`.

#### Level 115 application.properties
* **app.l115.queue.name1** - Queue name used by the application to query.

---

### Level 201 Sample
**MQ adaptors for DSL Integration Flows**

The Level 201 creates two DSL defined integration flows. In one a 
Jms inbound adaptor in used to enable MQ as the input. 
In the second MQ is used as the output from the integration flow.

It consists of 2 modules.
* **MessageConsumer201** - which sets up an integration flow listening on 
  Queue 2.
* **MessageProducer201** - which sets up an integration flow sending to 
  Queue 1.
  
To enable the 201 sample uncomment the `@Component` lines in `MessageConsumer201`
and `MessageProducer201`.

#### Level 201 application.properties
* **app.l201.queue.name1** - Queue name used by the application to put messages.
* **app.l201.queue.name2** - Queue name used by the application to get messages.

---

### Level 202 Sample
**MQ gateway for request / response in middle of a DSL Integration Flow**

The Level 202 creates a DSL defined integration flow, which sends a 
request to MQ and waits for a response. The flows have sample do nothing
filters and handlers showing where added functionality could be placed.

It consists of 1 module.
* **MessageProducer201** - which sets up an integration flow in the middle of which, 
  a request is send out to Queue 1 and the rest of the integration flow 
  continues with the response from Queue 2.

To enable the 202 sample uncomment the `@Component` line in `MessageProducer202`.

#### Level 202 application.properties
* **app.l202.queue.name1** - Queue name used by the application to put requests.
* **app.l202.queue.name3** - Queue name used by the application to receive responses.

---

### Level 203 Sample
**Sub and divide DSL Integration Flow**

The Level 203 creates a DSL defined integration flow, which subscribes to
messages on Topic 2 and forwards the message onto two further channels. 

It consists of 1 module.
* **MessageConsumer203** - which sets up an integration flow 
  that subscribes to messages and forwards each message to two 
  bridged channels. 

To enable the 203 sample uncomment the `@Component` line in `MessageConsumer203`.

#### Level 203 application.properties
* **app.l203.topic.name2** - Topic used by the application to subscribe.

---

### Level 204 Sample
**Action driven DSL Integration Flows**

The Level 204 sample is an alternative message send mechanism to the 
level 201 sample. A method is used to inject messages into a message
direct channel, which is then put to Queue 1.

It consists of 2 modules.
* **MessageProducer204** - which sets up an integration flow sending to
  Queue 1.
* **Scheduler204** - which sets up a scheduler to post a message every two 
  minutes.


To enable the 204 sample uncomment the `@Component` lines in `MessageConsumer204`
and `Scheduler204`.

#### Level 204 application.properties
* **app.l204.queue.name1** - Queue name used by the application to put messages.

---