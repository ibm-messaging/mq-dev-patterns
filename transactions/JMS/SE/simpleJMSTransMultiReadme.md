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

The first time you run the sample, all three messages should be put on the queue under a transaction.

Check the `DEV.QUEUE.1` queue on the `MQ Console` to confirm.

Edit the sample, comment out the code on line `105` and uncomment line `106`.

This will introduce an error to one of the messages and all three should roll back to the `BACKOUT.Q` instead of being put to the `DEV.QUEUE.1` under a commit.

Recompile the sample.

Run the recompiled sample.

Check the `MQ Console` - where did the messages end up?


Go ahead and try

- [Simple put transaction sample](simpleJMSTransaction.md)

or

- [Transaction in a request response scenario](simpleJMSTransReqRespReadme.md)


You can also go back to the starting [README](README.md) to read more and check out links to other useful topics on transactions.
