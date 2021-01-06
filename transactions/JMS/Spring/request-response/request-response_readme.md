Transaction in a simple request response scenario
==========================================

  * A requester sample - puts a message on the queue using the Spring send and receive method, provides a temporary queue where it waits for a reply.
  * A responder sample - message driven response/listener sample that receives a message, gets the reply queue from the requester and sends a message back.


## Steps

Open a terminal and a browser window with your `MQ Console` page, side by side.

You can use the `MQ Console` to see where your messages are ending up. 

In your terminal, move to your cloned local `mq-dev-patterns/transactions/JMS/Spring/` directory.


The [request-response](/request-response) sample directory contain a 'pom.xml' configuration file that includes dependencies to enable you to build or compile the sample without the need to download individual libraries.

We pull in the following

* mq-jms-spring-boot-starter with classes and beans that abstract the details for connecting to and interacting with MQ objects when using Spring. This pulls in other pre-req libraries

To compile or build, start from a root of the directory:


```
cd request-response
```

Run the maven build command:

```
mvn clean package dependency:copy-dependencies
```


To run the `request response` sample:

```
java -cp "target/classes/:target/dependency/*" com.ibm.mq.samples.jms.Requester
```
