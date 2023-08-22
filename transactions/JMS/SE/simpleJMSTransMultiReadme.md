Transaction when sending several messages together
==================================================

  * Send all three messages or none


## Steps

Open a terminal.

Have the terminal window side by side with a browser window with your `MQ Console` page.

Move to your local cloned `mq-dev-patterns/transactions/JMS/SE` directory.

Check you have the `javax.jms-api-2.0.1` and the `com.ibm.mq.allclient` jars.

Run the list command

```
ls
```

You should see the jars in amongst the other files:

```
javax.jms-api-2.0.1.jar
com.ibm.mq.allclient.9.2.0.0.jar
```

Compile the multiple message transaction sample:

```
javac -cp ./com.ibm.mq.allclient-9.2.0.0.jar:./javax.jms-api-2.0.1.jar com/ibm/mq/samples/jms/simpleJmsTransMulti.java
```

Run the compiled program:

```
java -cp ./com.ibm.mq.allclient-9.2.0.0.jar:./javax.jms-api-2.0.1.jar:. com.ibm.mq.samples.jms.simpleJmsTransMulti
```

Refresh the queues.

If the random number is odd, all three messages should be put on the queue under a transaction.

Check the `DEV.QUEUE.1` queue on the `MQ Console` to confirm.

If the random number is even, a rollback will be demonstrated.

When the first and second messages are sent, information about what has happened to the messages is logged to the terminal. At this point, refresh the `MQ Console` to confirm this behaviour.

After sending the first two messages, an error is introduced which prevents the third message from being sent. This means that none of the three messages are committed to the queue as they are all rolled-back.

Go ahead and try

- [Simple put transaction sample](simpleJMSTransaction.md)

or

- [Transaction in a request response scenario](simpleJMSTransReqRespReadme.md)


You can also go back to the starting [README](README.md) to read more and check out links to other useful topics on transactions.
