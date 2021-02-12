Local transactions in application servers with JMS and IBM MQ
=============================================================
## Are you onMessage?


In the [first article](https://developer.ibm.com/components/ibm-mq/articles/an-introduction-to-local-transactions-using-mq-and-jms/) in this series on transactions, we looked at what transactions are, how they are defined in JMS and in IBM MQ and shared a few samples for simple usage in stand-alone Java SE applications.

In this article we look at what you need to know to write applications for enterprise application servers.

Application servers provide abstractions that remove some of the complexity away from your app so you can concentrate on the business logic alone. The trade-off is that you have to know how to use the common services they provide, to achieve your goal.


## Jakarta Enterprise Edition (JEE)

Enterprise applications are not usually stand alone, there are lots of them, doing different things and connecting to resources through different protocols to exchange data and keep the state of all the participating resources consistent.
It makes sense for them to have a common environment to run in and once they're there, it might make sense that some of the repeated, common functionality is centralised on the platform so that new apps don't have to implement the same behaviours over and over again.

For Java, we start with [Jakarta Enterprise Edition (JEE)](https://jakarta.ee/about/), a specification used to define a JEE platform which is referred to as a [JEE container](https://docs.oracle.com/javaee/7/tutorial/overview004.htm), a server environment in which our application can run that also provides common services and APIs.

Examples of such JEE compliant platforms are IBM's WebSphere Application Server or it's lighter, open source version [Liberty](https://openliberty.io/), RedHat's JBoss, Oracle's GlassFish etc.

The aim of the JEE specification is to standardise how distributed computing and web services work in enterprise servers.

For a good overview of the Java EE Architecture see this page from the
[book by Arun Gupta, Java EE 7 Essentials](https://learning.oreilly.com/library/view/java-ee-7/9781449370589/ch01.html ) and [this Stack Overflow answer that summarises the Java EE specifications](https://stackoverflow.com/questions/37082364/a-summary-of-all-java-ee-specifications ).


## Connecting Liberty and MQ via JMS


We used JMS in several tutorials to create stand-alone Java SE apps and have seen how transactions work with just JMS and MQ but what do transactional JMS enterprise applications look like when they are created to run on app servers?

Let's look at a more specific set of resources that make up an app server, based on the JEE specification.

In this diagram we have the Liberty app server working with a resource adapter to allow a message to be sent to a queue on an IBM MQ queue manager. Both Liberty and MQ support JMS messaging. A web application sends a message to a queue on which a message driven bean is listening. The message driven bean is also running in the app server but is not consuming any resources until a message arrives. The resource adapter enables the communication between the Liberty app server and IBM MQ to happen so that a message is sent to the queue and the listener gets the message when it arrives on the queue.


![Java EE 7 Architecture](/transactions/JMS/Spring/images/liberty_mq_ra_mdb.png)

*Figure 1 Applications using Liberty app server resources and MQ Resource adapter to connect to a queue manager and send/receive messages*

In the previous article we saw that a in a Java SE scenario, the transaction was coordinated between MQ as the messaging provider and the JMS API.

We added a transacted property to a JMS context (or session) before starting a method or a group of methods and ended the transaction with a commit. Depending on how critical the messages we were sending inside the transaction were, we made sure when rolling them back that they ended up on a queue they started from or if a message was just created before being a part of the transaction, it might have been thrown away. If the message was important and it didn't come from a queue which it could go back to, we made use of the JMS API call to put it to a backout queue we named for this purpose. If we didn't name the backout queue, we relied on the queue manager to put the message on the dead letter queue.

In the app server environment, service components take over the role of managing transactions. Rather than just knowing which JMS classes to use, you need to know that at a certain point the JEE platform will take over, do things under the covers and provide transactionality for your app.  Your application needs to behave in the right way.

This is where we get to the concept of transaction demarcation. This means setting the boundaries of where the transaction begins and ends.  

In Java EE, there are two ways to manage transactions. They help you understand what and how much you're responsible for when including a transaction in your app.

### Container managed transaction demarcation

In container managed transaction demarcation the EJB container sets the transaction boundaries. In basic terms, the transaction starts before the bean method starts and commits just before the method exits. Read more about [container managed transactions](https://javaee.github.io/tutorial/transactions004.html#BNCIJ) and how to use the attributes to set the scope for this kind of transaction.

### Bean managed transaction demarcation

Bean managed transaction demarcation allows developers to explicitly mark the transaction boundaries. It allows for a more fine-grain control over transactions. Read this tutorial for more on [bean managed transactions](https://javaee.github.io/tutorial/transactions005.html).

But we jumped in there a bit quick. Before you use transactions, you should know a little about these app server concepts first.

### Enterprise Java Beans (EJBs)

Enterprise java beans are server side components that provide some business logic to application clients. Clients invoke the EJB methods to use a service provided by the bean. EJBs run in EJB containers which provide services like transactionality and security.

### Message Driven Beans (MDBs)

Message driven beans are a type of EJBs. They allow enterprise applications to process messages asynchronously. They are usually message listeners listening for messages from applications or other components. When a message arrives, the EJB container calls the message listener's onMessage method to process the message.

### Contexts and dependency injection

Contexts provide lifecycle management for stateful components like beans and dependency injection allows for injection of components into applications to be used at deployment time.

### Descriptors and annotations

Deployment descriptors are xml files that describe how applications should be deployed and what dependencies should be injected. Annotations are used in applications to add the injection in classes and methods, removing the need for XML configuration files. Annotations are more recent but both are still in use and can be used in combination.

This is just the tip of the iceberg of what a developer should be familiar with in order to write good JEE applications that run in app servers.

## Spring

Spring promises a more developer friendly approach to using the resources that a JEE compliant framework provides.


![Spring framework components](/transactions/JMS/Spring/images/spring-overview.png)

*Figure 2 Overview of the [Spring framework modules]( https://docs.spring.io/spring-framework/docs/4.3.20.RELEASE/spring-framework-reference/html/overview.html )*

## Is Spring better?

Spring provides its own abstraction on top of the JEE specification. Spring works with plain old java objects (POJOs) and does not require you to understand how JEE works. The Spring framework hides the app server layer and gives you a different way of achieving your goals.

With the EJB container, you can give it an annotation or a descriptor and the app server orchestrates things for you, with the bean you do it programmatically. In Spring it is the same, you can rely on the container and they'll manage it for you or you can do it yourself. You just have to learn a little about Spring annotations and classes, the framework will do the rest for you.

Your application built for Spring is still portable. Spring gives you an app server agnostic way of doing things.


Spring has its own [model for managing transactions](https://docs.spring.io/spring-framework/docs/current/reference/html/data-access.html) that is JEE compliant. This model provides abstractions for enabling transactions [declaratively](https://docs.spring.io/spring-framework/docs/current/reference/html/data-access.html#transaction-declarative) or [programatically](https://docs.spring.io/spring-framework/docs/current/reference/html/data-access.html#transaction-programmatic).


Declarative transaction management is Spring's preferred way of working with transactions because it has less impact on the application code. Spring warns developers that it is useful to understand that the functionality of transactions goes beyond the `@Transactional` annotation and the `@EnableTransactionManagement` configuration. The support for transactions is provided through Spring's AOP proxies and transactional metadata. Read more about it in [this section](https://docs.spring.io/spring-framework/docs/current/reference/html/data-access.html#tx-decl-explained) of the Spring doc.

We're mentioning Spring's declarative transaction management because this is what we're using in our samples.

In practical terms we can demonstrate simple usage through these samples. Let’s see how transactions work in practice in Spring.

## Transactions with IBM MQ and Spring

We provide two sets of simple transacted samples.

[Sample 2 - simple application](https://github.com/ibm-messaging/mq-jms-spring/blob/master/samples/s2/src/main/java/sample2/Application.java) shows a transaction with a commit and a rollback.

[Sample 3 requester](https://github.com/ibm-messaging/mq-jms-spring/blob/master/samples/s3/src/main/java/sample3/Requester.java) is a request sample that puts a message on the queue using the Spring send and receive method, provides a temporary queue where it waits for a reply.

[Sample 3 responder](https://github.com/ibm-messaging/mq-jms-spring/blob/master/samples/s3/src/main/java/sample3/Requester.java) is a message driven response/listener sample that receives a message, gets the reply queue from the requester and sends a message back.

They are designed to work with the IBM MQ container with the default developer configuration.

## How do I get the samples?

We give you a couple of options for exploring the samples.

1. The samples are included in [this GitHub repository](https://github.com/ibm-messaging/mq-jms-spring) that has the code for integrating MQ JMS with Spring (the `mq-spring-boot-starter`).
Follow the instructions in the main [`mq-jms-spring` Readme](https://github.com/ibm-messaging/mq-jms-spring) to clone, build and run the samples locally with Gradle.
2. If you need step by step instructions, you can also clone the [`mq-dev-patterns`](https://github.com/ibm-messaging/mq-dev-patterns) repository and follow the instructions in the [`Spring directory Readme`](spring_readme.md) to use the samples sets 2 and 3 from `mq-jms-spring` repository and run them with Maven. Full instructions are in the [`Spring directory Readme`](spring_readme.md).

## What features of Spring are the samples using

For a quick note on some of the annotations we're using in our samples, read a bit more below or [jump straight into the samples](spring_readme.md).

We use [Spring Boot](https://spring.io/projects/spring-boot) in our applications. Spring Boot is an extension to Spring that allows for building and running of stand-alone Spring applications without much configuration.

Along with the `mq-spring-boot-starter` that provides the helper classes for integrating with IBM MQ, you can get started very quickly.

We tell Spring that we're using Spring Boot by adding the
[@SpringBootApplication annotation](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#using-boot-using-springbootapplication-annotation). It lives along our [`main` class](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#using-boot-locating-the-main-class).

We use Spring's `externalised configuration` properties in the form of an [application.properties file](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-external-config-files) which Spring Boot finds and loads when the application starts. This is how we provide some of the MQ connection variables and user details for our app to access the queue manager.

```
ibm.mq.queueManager=QM1
ibm.mq.channel=DEV.APP.SVRCONN
ibm.mq.connName=localhost(1414)
ibm.mq.tempModel=DEV.APP.MODEL.QUEUE

ibm.mq.user=app
ibm.mq.password=passw0rd
```

As mentioned in the [`Messaging with JMS` Spring guide](https://spring.io/guides/gs/messaging-jms/) we use the [@EnableJms annotation](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jms/annotation/EnableJms.html) to "trigger the discovery of methods annotated with @JmsListener and create the message listener container under the covers".

We use the [@EnableTransactionManagement annotation](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/EnableTransactionManagement.html) to make use of the declarative transaction management.

We use the [JMSTemplate](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jms/core/JmsTemplate.html) to create the JMS Template object to control connections and sessions.

We use the [JmsTransactionManager](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jms/connection/JmsTransactionManager.html) because we want to retrieve the JMS Session and use the same transaction to send a reply after we get a request message.


[TransactionStatus](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/TransactionStatus.html) represents the status of a transaction and can be retrieved to find out the status information and programatically request a rollback.



## Summary

In this article we looked at how JMS messaging applications work in applications servers, both JEE and Spring. We looked at what it takes for transactions to work in such environments. While JEE compliant application servers offer a sophisticated environment for applications to make use of the platform's services such as transactionality, its complexity, packaging and deployment strategies might create barriers for developers to get started with easily.
The Spring framework seeks to simplify access to its resources by cutting out the middle layer by hiding it behind the abstractions that POJOs can use through straight forward annotations while the framework wires everything together as needed for applications to work.
Transactions are an essential part of enterprise application programming. Regardless of whether your applications need to work with JEE servers or Spring, if the messaging payload is of value, IBM MQ is flexible and can support either.


## Useful links

[Deploying a Message Driven Bean in Open Liberty with IBM MQ](https://community.ibm.com/community/user/middleware/blogs/anthony-beardsmore1/2020/09/08/openliberty-ibmmq)

[Getting IBM JMS samples working in a WAS Liberty Web Server on Ubuntu for people who cannot spell Java Massage Service](https://colinpaice.blog/2018/12/03/getting-ibm-jms-samples-working-in-a-was-libery-web-server-on-ubuntu-for-people-who-cannot-spell-java-massage-service/)

[Installing the resource adapter in Liberty](https://www.ibm.com/support/knowledgecenter/en/SSFKSJ_9.2.0/com.ibm.mq.dev.doc/q128160_.html)

[Verifying the resource adapter installation (with an Installation Verification Test (IVT) sample)](https://www.ibm.com/support/knowledgecenter/SSFKSJ_9.2.0/com.ibm.mq.dev.doc/q031760_.html)

[WAS: Java EE architecture: Containers, Components, Annotations](https://www.youtube.com/watch?v=5CVbtcHoVxA)

[Transactions in Java EE Applications](https://docs.oracle.com/javaee/7/tutorial/transactions001.htm)

[Spring Boot Messaging with JMS](https://spring.io/guides/gs/messaging-jms/)

[Spring transaction management](https://docs.spring.io/spring-framework/docs/current/reference/html/data-access.html#transaction)

Books

[Java EE The big picture - Dr Danny Coward](https://learning.oreilly.com/library/view/java-ee-7/9780071837347/)

[Expert One-on-One™ J2EE™ Development without EJB™ - Rod Johnson, Juergen Hoeller](https://learning.oreilly.com/library/view/expert-one-on-onetm-j2eetm/9780764558313/)

[Professional Java™ Development with the Spring Framework - Rod Johnson, Juergen Hoeller, Alef Arendsen, Thomas Risberg, Colin Sampaleanu](https://learning.oreilly.com/library/view/professional-javatm-development/9780764574832/)
