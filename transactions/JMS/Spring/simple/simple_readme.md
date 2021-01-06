Transaction in a simple point to point scenario
==========================================

  * Transaction with a commit and a rollback - the sample puts a message on `DEV.QUEUE.1`, commits, gets it back from the same queue and tries to put it to `DEV.QUEUE.2` but calls a rollback and so the message is reverted back to `DEV.QUEUE.1`.


## Steps

Open a terminal and a browser window with your `MQ Console` page, side by side.

You can use the `MQ Console` to see where your messages are ending up. 

In your terminal, move to your cloned local `mq-dev-patterns/transactions/JMS/Spring/` directory.


The [simple](/simple) sample directory contain a 'pom.xml' configuration file that includes dependencies to enable you to build or compile the sample without the need to download individual libraries.

We pull in the following

* mq-jms-spring-boot-starter with classes and beans that abstract the details for connecting to and interacting with MQ objects when using Spring. This pulls in other pre-req libraries

To compile or build, start from a root of the directory:


```
cd simple
```

Run the maven build command:

```
mvn clean package dependency:copy-dependencies
```

To run the `simple` sample:

```
java -cp "target/classes/:target/dependency/*" com.ibm.mq.samples.jms.Application
```

To run the `request response` sample:

```
java -cp "target/classes/:target/dependency/*" com.ibm.mq.samples.jms.Requester
```
