Simple put transaction sample
=============================

* Transacted context
* Commit
* Rollback

#### Point-to-point without a transaction

![Point-to-point with IBM MQ](/transactions/JMS/SE/images/ibm_mq_point_to_point.gif)

#### Point-to-point with a transaction

![Point-to-point with a transaction](/transactions/JMS/SE/images/ibm_mq_transaction_msg_b4_commit.png)

#### Point-to-point with a transaction - commit

![Point-to-point with a transaction](/transactions/JMS/SE/images/ibm_mq_transaction_msg_commited.png)

#### Point-to-point with a transaction - rollback step 1

![Point-to-point with a transaction](/transactions/JMS/SE/images/ibm_mq_transaction_msg_rollback.png)

#### Point-to-point with a transaction - rollback step 2

![Point-to-point with a transaction](/transactions/JMS/SE/images/ibm_mq_transaction_MSG_rollback_2.png)



## Steps

Open a terminal window.

Have the terminal window side-by-side with a browser window open at your MQ Console.

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

Compile the simple put transaction sample:

```
javac -cp ./com.ibm.mq.allclient-9.2.0.0.jar:./javax.jms-api-2.0.1.jar com/ibm/mq/samples/jms/simpleJmsTransaction.java
```

Run the compiled program:

```
java -cp ./com.ibm.mq.allclient-9.2.0.0.jar:./javax.jms-api-2.0.1.jar:. com.ibm.mq.samples.jms.simpleJmsTransaction
```

Refresh the queues.

Depending on whether the random number is odd or even, the program will call a commit or rollback method.

During the 15 second wait in the program before rollback or commit is called, you'll see the queue depth increase on the target queue `DEV.QUEUE.1`.

If you refresh the queues after the 15 second wait is over, the queue depth will update;

If the random number was odd, commit is called and the message is put on the `DEV.QUEUE.1` queue.

If the random number was even, rollback is called and the message is rolled back and not put to the queue.


Go ahead and try

- [Transaction in a request response scenario](simpleJMSTransReqRespReadme.md)

or

- [Transaction when sending several messages together](simpleJMSTransMultiReadme.md)

You can also go back to the starting [README](README.md) to read more and check out links to other useful topics on transactions.
