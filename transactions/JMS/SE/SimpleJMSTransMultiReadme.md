Transaction when sending several messages together
==================================================

  * Send all three messages or none by executing a commit or a rollback


## Steps

Open a terminal.

Have the terminal window side-by-side with a browser window with your `MQ Console` page.

Move to your local cloned `mq-dev-patterns/transactions/JMS/SE` directory.

Check you have the `jakarta.jms-api` and the `com.ibm.mq.jakarta.client` jars.

Run the list command

```
ls
```

You should see the jars in amongst the other files:

```
jakarta.jms-api.jar
com.ibm.mq.jakarta.client.jar
```

Compile the multiple message transaction sample:

```
javac -cp ./com.ibm.mq.jakarta.client.jar:./jakarta.jms-api.jar com/ibm/mq/samples/jms/simpleJmsTransMulti.java
```

Run the compiled program:

```
java -cp ./com.ibm.mq.jakarta.client.jar:./jakarta.jms-api.jar:. com.ibm.mq.samples.jms.simpleJmsTransMulti
```

Within the program a random number is generated and depending on if it is odd or even, either a COMMIT or ROLLBACK will
be carried out

In the terminal, pauses let you refresh DEV.QUEUE.1 so you can see the effect on the queue at each stage.

When a commit is being demonstrated, you will see all 3 messages being sent to the queue, though they won't be visible.
Then a commit will occur which will irreversibly put the 3 messages on to the queue, where should be visible to you.

In the event of a rollback, you will see 2 messages being sent to the queue, again they won't be visible yet. Before the
third message can be sent an "error" will occur, triggering a rollback. Follow the instructions in the terminal to see
what effect this has on the contents of DEV.QUEUE.1.

Go ahead and try

- [Simple put transaction sample](SimpleJMSTransaction.md)

or

- [Transaction in a request response scenario](SimpleJMSTransReqRespReadme.md)


You can also go back to the starting [README](README.md) to read more and check out links to other useful topics on
transactions.
