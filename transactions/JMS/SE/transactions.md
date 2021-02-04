Local transactions with JMS and IBM MQ
======================================

Transactions help application developers wrap important message exchange flows in ‘state wrappers’ that use features of MQ and JMS specification, to ensure a number of actions like puts and gets either all happen or none do and can be reversed and then retried if something in a flow does not work as desired.

## What are transactions

IBM MQ includes native support for transactions.

Stepping back, we say that queues are used to decouple applications, act as shock absorbers and allow us to build scalable and reliable solutions and applications.

Rather than connecting to each other, apps connect to queues, put and get messages and then disconnect. A collection of these actions combined to achieve a particular task, or operation, is called a unit of work.

In IBM MQ, a sync point defines a transactional boundary.

When a transaction is committed all work since the last sync point is committed. Equally, when a transaction is rolled back, all work since the last sync point is rolled back.

Like many messaging providers, IBM MQ supports the JMS API which provides a convenient and ‘code portable’ way for developers to interact with the messaging layer.

In the [JMS specification](https://jcp.org/aboutJava/communityprocess/final/jsr343/index.html), transactions are defined at the session level: “Each transaction groups a set of produced messages and a set of consumed messages into an atomic unit of work. In effect, transactions organize a session’s input message stream and output message stream into a series of atomic units. When a transaction commits, its atomic unit of input is acknowledged, and its associated atomic unit of output is sent. If a transaction rollback is done, its produced messages are destroyed and its consumed messages are automatically recovered.”
In computer science atomicity guarantees that each transaction is treated as a single "unit", which either succeeds completely, or fails completely.

The IBM MQ client libraries include support for transactions. JMS programmers control transactions at the JMS Session level by adding a simple parameter to a session or context object in your application. When ‘commit’ is called all actions on the JMS session, since the last commit call, are completed.
If something goes wrong with the actions inside the transaction, everything is rolled back to the beginning of the transaction, including the state of all the participating objects or components,

There are several concepts and features that will help you design a resilient solution that uses the benefits that MQ, JMS and transaction provide, in an optimal way. It is important to understand that these concepts are, how they interact and what they can do for you, first. Let’s have a look.

![Point to point with IBM MQ](/transactions/JMS/SE/images/ibm_mq_point_to_point.gif)

This is what a put and get operation looks like with one sender and one receiver connecting to the same queue. You can handle exceptions and errors in your apps programmatically and MQ will help you with reliability with auto-reconnect for example. But transactions give you a more fine grained control of what happens.



When you add a transaction, for example on the put operation, this gives you more control and further options for what to do with the message if things don’t go according to plan. For example, the fact that a message is being sent might be logged to a file. Should the output stream fail because the disk full then the app might not call commit.

![Put under a transaction - start](/transactions/JMS/SE/images/put.png)

How can we use these building blocks to create a more sophisticated and intelligent messaging application?
and what else should you think about as a developer?

Transacted session - a JMS session with a transacted parameter, can include one or several actions ending with a commit to complete or a rollback in case something went wrong. While the actions are in progress, messages exchanged are not available on the queue. For example, if you’re sending three messages under a transaction, the first two messages will not be available on the queue to a consumer until the third message is put and the transaction committed. At this point, although the message is put to the queue, it is not available to other applications until commit is called.

![Put under a transaction - put](/transactions/JMS/SE/images/put_2.png)

Without the transaction:
```
      connection = cf.createConnection();
      session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
      destination = session.createQueue("queue:///DEV.QUEUE.1");
      consumer = session.createConsumer(destination);
```
With the transaction parameter:
```
      connection = cf.createConnection();
      session = connection.createSession(Session.SESSION_TRANSACTED);
      destination = session.createQueue("queue:///DEV.QUEUE.1");
      consumer = session.createConsumer(destination);
```

**Commit** - a point at which a synchronisation of state happens for all participants in a transaction. The JMS specification defines this as a method on the session. When you call commit, any operations, puts or gets, will be committed. When the commit is called, a put that is under a transaction will make the message available on the queue for other applications to consume.

![Put under a transaction - commit](/transactions/JMS/SE/images/put_commit.png)

**Rollback** -  a point at which, if a commit doesn’t happen, the state is rolled back to the previous point of synchronisation, either since the last commit or the start of the session (whichever is most recent). Any messages destined for queues will be deleted. You can easily test this by calling rollback instead of commit when putting a message.

Step 1 - The put is under a transaction, the message gets to the queue but it is not yet available.

![Put under a transaction - rollback](/transactions/JMS/SE/images/ibm_mq_transaction_msg_rollback.png)

Step 2 - When the transaction is ended with rollback instead of a commit, the message is removed from the queue as the state is returned to the starting point before the transaction started.

![Put under a transaction - rollback 2](/transactions/JMS/SE/images/ibm_mq_transaction_MSG_rollback_2.png)

All this transaction stuff is great, but it leaves us with a problem: what if you can’t complete a task because of a persistent error? We don’t want to be stuck in an endless loop of trying to do something that is going to fail. Messaging developers refer to this situation as the ‘poison message problem’. To help deal with this, two special queues are defined: a backout queue (a place to put messages that when processing fails beyond a set threshold) and a dead letter queue (a place to put messages as a last resort).

**Backout queue** - used for JMS applications, defined for each queue, can have one for multiple source queues. Message can be moved to the backout queue by the MQ JMS client library classes or an application can have extra logic to do it. Messages on the backout queue do not get the extra header. If the JMS classes handle the message, the backout count attribute in the message descriptor is incremented.

**Backout count** - an indicator as to a number of times a message has been unsuccessfully handled by an application. With IBM MQ, a backout threshold can be set on the target queue (DEV_Q) which when reached can be a signal to the application to put the message to a backout queue. Developer takes responsibility for this by determining the threshold programmatically within the application or if using IBM MQ, sets a backout threshold on the queue (for example, when a consumer can’t process the message, the MQ client moves that message to the back out queue. Backout count is an attribute of the message.

**Dead letter queue** - controlled by the queue manager, every queue manager has one - queue manager is in charge of placing an undeliverable message to the desd letter queue.


**Sync point in IBM MQ** - logical point within a sequence of operations at which it is useful to synchronise data changes. In a simple transaction, this can be at the end of a transaction when a commit is called.

**Unit of work in IBM MQ** - period of processing a set of updates between two sync points. There can be one or several calls within one unit of work. Typically, this is a set or a sequence of logical tasks or operations that developers define.


**Poison message** - a message which can’t be processed by the receiving application and is returned to the queue (this can be because of the wrong message format or another component in exchange is not ready). App will keep trying to get the message and then returning it causing an infinite loop.

If the message cannot be put to the defined backout queue and is not able to be put to the dead letter queue then the message is discarded.

Everything we’ve looked so far applies to local transactions but what if the transaction needs to extend beyond a simple interaction with one messaging resource? For example, two or more queue managers, databases or other systems. Software engineers define two terms, local and global.

**Local transactions** - transactions involving applications and a single resource manager - in this case JMS provider - IBM MQ

**Global transactions** - transactions involving several messaging servers, databases or other transactional resources across a distributed topology.

Find out more about [global transactions in the IBM MQ knowledge center here]( https://www.ibm.com/support/knowledgecenter/SSFKSJ_latest/com.ibm.mq.pro.doc/q023320_.htm).
From an MQ perspective, we talk about local and global units of work.


## Why are transactions helpful to developers?

Transactions allow you to write reliable distributed applications and give you more ways to control modifications of application state. Messaging developers can use transactions to write more sophisticated and intelligent applications that extend beyond a simple put and get API call and perform an end-to-end set of operations as a unit of work.



## Application design decisions - transaction examples

Now that you know a little bit about the components in play when it comes to transactions, it becomes clear that a lot of the responsibility for the application design is on you, the developer to ensure these resources are used in the most optimal way.  Don’t worry, we have a set of samples to get you started.

To see how local transaction with JMS and IBM MQ work in practice, have a look at our samples in GitHub.

You’ll be able to see how transactions work with commit and rollback, how to set up a back out threshold on the queue, how backout count is used and how to see if a transaction actually happened.

## Summary

We have introduced transactions and related concepts in IBM MQ and JMS. Transactions help developers build resilient applications, provide mechanisms for controlling state and for all the components in the transaction being at the right syncpoint at all times, even allowing for system or component failure.

### Useful links and further reading

[Transacted sessions in JMS applications](https://www.ibm.com/support/knowledgecenter/SSFKSJ_latest/com.ibm.mq.dev.doc/q032220_.htm)

[Using JMS local transactions](https://javaee.github.io/tutorial/jms-concepts004.html#BNCGH)

[Committing and backing out units of work](https://www.ibm.com/support/knowledgecenter/SSFKSJ_latest/com.ibm.mq.dev.doc/q026790_.htm)

[Local units of work](https://www.ibm.com/support/knowledgecenter/SSFKSJ_latest/com.ibm.mq.dev.doc/q026870_.htm)

[Global units of work](https://www.ibm.com/support/knowledgecenter/SSFKSJ_latest/com.ibm.mq.dev.doc/q026880_.htm)

[Understanding JTS - An intro to transactions](https://www.ibm.com/developerworks/library/j-jtp0305/index.html)

[Differences between a backout queue and a dead letter queue](https://www.ibm.com/support/pages/what-are-differences-between-mq-dead-letter-queue-dlq-or-deadq-and-backout-queue-boqname)

[Handling poison messages in IBM MQ classes for JMS](https://www.ibm.com/support/knowledgecenter/SSFKSJ_latest/com.ibm.mq.dev.doc/q032280_.htm)

[Understanding MQ Backout Queues & Thresholds](https://community.ibm.com/community/user/imwuc/browse/blogs/blogviewer?BlogKey=28814801-083d-4c80-be5f-90aaaf81cdfb)
