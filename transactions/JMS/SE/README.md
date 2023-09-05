Transactions with JMS and IBM MQ
================================

## What are Transactions

Read [this transactions article](https://ibm.biz/mq-basic-tx) for an intro to transactions. If you've just come from there, you're in the right place, continue reading and explore the samples.

Transactions give you special powers, but as a developer, it is down to you to understand enough of the concepts and features that the JMS API and IBM MQ provide to get the most out of transactions in your applications.

We’ve provided you with some basic building blocks to help you on your way.

Our transaction samples are based on a basic point-to-point scenario involving a sender and a receiver. 

#### Point-to-point without a transaction


![Point-to-point with IBM MQ](/transactions/JMS/SE/images/ibm_mq_point_to_point.gif)

More on building apps for IBM MQ at [LearnMQ](https://ibm.biz/learn-mq).

We then add transactions.

#### Point to point with a transaction on the sender side

![Point-to-point with IBM MQ](/transactions/JMS/SE/images/ibm_mq_transaction.png)

## Getting started with transactions

- [Get a queue manager](#get-a-queue-manager)
- [Open MQ Console](#open-mq-console)
- [Set up a backout queue](#set-up-a-backout-queue)
- [Clone this repo](#clone-this-repo)
- [Get the prereq jars](#get-the-prereq-jars)
- [Try out the samples](#try-out-the-samples)


## Get a queue manager
Follow [this tutorial](https://ibm.biz/mq-create-queue-manager) in the IBM Developer MQ hub for full instructions.

If you've already used Docker, just run these commands to get set up:

Get the latest container image from Docker Hub:

```
docker pull icr.io/ibm-messaging/mq:latest
```

Check you got the image:

```
docker images
```

You'll see:
```
REPOSITORY                               TAG                 IMAGE ID            CREATED             SIZE
icr.io/ibm-messaging/mq                  latest              a583b9db53a6        5 weeks ago         989MB
```

Create a volume to preserve data separate from the container:

```
docker volume create qm1data
```

Run the container:

```
docker run --env LICENSE=accept --env MQ_QMGR_NAME=QM1 --volume qm1data:/mnt/mqm --publish 1414:1414 --publish 9443:9443 --detach --env MQ_APP_PASSWORD=passw0rd icr.io/ibm-messaging/mq:latest
```

Check the container is up and running:

```
docker ps
```

You'll see:

```
CONTAINER ID        IMAGE                             COMMAND             CREATED             STATUS              PORTS                                                      NAMES
someID              icr.io/ibm-messaging/mq:latest    "runmqdevserver"    2 days ago          Up 2 days           0.0.0.0:1414->1414/tcp, 0.0.0.0:9443->9443/tcp, 9157/tcp   cool_name
```


## Open MQ Console

Once the container with the queue manager is running, you should be able to access the MQ Console in your browser [https://localhost:9443/ibmmq/console/login.html](https://localhost:9443/ibmmq/console/login.html)

Log in with user `admin` and password `passw0rd`.

Click the `Manage QM1` tile.

You'll see several pre-configured queues. Keep your browser window open on this page, this is where you'll be checking for messages when you start playing with the samples.


## Set up a backout queue

### Create the backout queue

Click the `Create +` button to create a backout queue for the `DEV.QUEUE.1`. This is where the JMS code will put any messages that are rolled back.

Click the `Local` tile to choose the queue type.

Name your queue `DEV.BACKOUT.Q`.

Click `Create`.

You'll see your new backout queue at the top of the list of queues on the `Manage queue manager QM1 page`.

Click the three dots at the end of the row of the `DEV.BACKOUT.Q` to open the list of options.

Click `Configuration` then click the `Security tab`.

Click the three dots at the end of the `app` row, then click `Edit`.

Tick the `Pass all context` box, click `Save`.

Go back to the page with all the queues by clicking the `QM1` link in the breadcrumb menu at the top of the page.

### Add the backout queue name to the target queue

We'll be using the `DEV.QUEUE.1` as our main target queue. You need to tell this queue the name of the backout queue where JMS will put messages that can't be committed.

Click the three dots at the end of the row of the `DEV.QUEUE.1` to open the list of options then click `Configuration`.

Click the `Edit` button, then `Storage`. Fill in the `Backout requeue queue` field with `DEV.BACKOUT.Q`.

Set the `Backout` threshold to `3`.

Hit the `Save` button.

Scroll back to the top and click the `QM1` link to get back to the page with the queues.

Keep this page open.

## Clone the parent mq-dev-patterns repo

Clone or download this repo to your local machine.

To clone:

```
git  clone git@github.com:ibm-messaging/mq-dev-patterns.git
```

Move into the `mq-dev-patterns/transactions/JMS/SE` directory.

```
cd mq-dev-patterns/transactions/JMS/SE
```

## Get the prereq jars

Download the [javax.jms-api-2.0.1](https://mvnrepository.com/artifact/javax.jms/javax.jms-api/2.0.1) and the [com.ibm.mq.allclient](https://mvnrepository.com/artifact/com.ibm.mq/com.ibm.mq.allclient/9.2.0.0) jars.

Put them in the `mq-dev-patterns/transactions/JMS/SE` directory, alongside the `com`, `images` and the readme files.

## Try out the samples

You should now be ready to try out the samples.
Pick one and click the link for further instructions.

- [Simple put transaction sample](simpleJMSTransReadme.md)
  * Transacted context
  * Commit
  * Rollback

- [Transaction in a request response scenario](simpleJMSTransReqRespReadme.md)
  * Transacted context on the responder side
  * Use of commit and rollback

- [Transaction when sending several messages together](simpleJMSTransMultiReadme.md)
  * Send all three messages or none

* How do I know a transaction has happened?
