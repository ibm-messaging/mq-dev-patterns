Transaction in a request response scenario
==========================================

  * Transacted context on the responder side
  * Use of commit and rollback

#### Request response without a transaction

![Request response without transactions](/transactions/JMS/SE/images/req_resp_animation_no_trans.gif)


#### Request response with a transaction

  ![Point to point with IBM MQ](/transactions/JMS/SE/images/req_resp_animation_trans.gif)


## Steps

Open two terminals.

Have the terminal windows side by side with a browser window with your `MQ Console`.

Move to your local `mq-dev-patterns/transactions/JMS/SE` directory in each terminal.

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

In the first terminal you'll be running the requestor app.

In the second, you'll be running the responder app.


Compile the requestor transaction sample in the first terminal.

```
javac -cp ./com.ibm.mq.allclient-9.2.0.0.jar:./javax.jms-api-2.0.1.jar com/ibm/mq/samples/jms/simpleJmsTransRequest.java
```

Compile the responder transaction sample in the second terminal.

```
javac -cp ./com.ibm.mq.allclient-9.2.0.0.jar:./javax.jms-api-2.0.1.jar com/ibm/mq/samples/jms/simpleJmsTransResponse.java
```

Run the compiled requestor transaction sample.

```
java -cp ./com.ibm.mq.allclient-9.2.0.0.jar:./javax.jms-api-2.0.1.jar:. com.ibm.mq.samples.jms.simpleJmsTransRequest
```

Run the compiled responder transaction sample.

```
java -cp ./com.ibm.mq.allclient-9.2.0.0.jar:./javax.jms-api-2.0.1.jar:. com.ibm.mq.samples.jms.simpleJmsTransResponse
```

Refresh the queues on the `MQ Console` page.

Depending on whether the random number was odd or even, the program calls a commit or rollback method.

During the 15 second wait in the program before rollback or commit is called, you'll see the queue depth increase on the target queue `DEV.QUEUE.1`.

If you refresh the queues after the 15 second wait is over, the queue depth will update;

If the random number was odd, commit is called and the message is put on the `DEV.QUEUE.1` queue.

If the random number was even, rollback is called and the message is rolled back to the `BACKOUT.Q`.




### Go ahead and try

- [Simple put transaction sample](simpleJMSTransaction.md)

or

- [Transaction when sending several messages together](simpleJMSTransMultiReadme.md)

You can also go back to the starting [README](README.md) to read more and check out links to other useful topics on transactions.
