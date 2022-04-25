Transactions with Spring and IBM MQ
===================================

## Working with transactions in app server environments

Read [this article](transactionsAppServers.md) for an intro.

As we mentioned before, transactions give you special powers as a developer but to get the most out of transactions in your applications, you should understand how to use the app server or framework to your best advantage. The article should help with that.

The samples provided here show you how to get started with transactions using the Spring framework and IBM MQ.


We’ve provided you with some basic building blocks to help you on your way.


#### A simple transaction in Spring with IBM MQ

![Simple Spring app with IBM MQ](/transactions/JMS/Spring/images/ibm_mq_spring.png)


#### A request response  with a transaction on the responder/listener side

![Request response Spring app with IBM MQ](/transactions/JMS/Spring/images/ibm_mq_transaction_liberty.png)

## Getting started with transactions

- [Get a queue manager](#get-a-queue-manager)
- [Open MQ Console](#open-mq-console)
- [Set up a backout queue](#set-up-a-backout-queue)
- [Clone this repo](#clone-this-repo)
- [Build with Maven](#build-with-maven)
- [Try out the samples](#try-out-the-samples)

## Get a queue manager
Follow [this tutorial](https://developer.ibm.com/components/ibm-mq/tutorials/mq-connect-app-queue-manager-containers/) in IBM Developer MQ hub for full instructions.

If you've already used Docker, just run these commands to get set up:

Get the latest container image:

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

Name your queue `BACKOUT.Q`.

Click `Create`.

You'll see your new backout queue at the top of the list of queues on the `Manage queue manager QM1 page`.

Click the three dots at the end of the row of the `BACKOUT.Q` to open the list of options.

Click `Configuration` then click the `Security tab`.

Click the three dots at the end of the `app` row, then click `Edit`.

Tick the `Pass all context` box, click `Save`.

Go back to the page with all the queues by clicking the `QM1` link in the breadcrumb menu at the top of the page.

### Add the backout queue name to the target queue

We'll be using the `DEV.QUEUE.1` and `DEV.QUEUE.2` as our two target queues. You need to tell these queues the name of the backout queue where JMS will put messages that can't be committed.

Click the three dots at the end of the row of the `DEV.QUEUE.1` to open the list of options then click `Configuration`.

Click the `Edit` button, then `Storage`. Fill in the `Backout requeue queue` field with `BACKOUT.Q`.

Set the `Backout` threshold to `3`.

Hit the `Save` button.

Do the same for `DEV.QUEUE.2`.

Scroll back to the top and click the `QM1` link to get back to the page with the queues.

Keep this page open.

## Clone the parent `mq-dev-patterns` repo

Clone or download this repo to your local machine.

To clone:

```
git  clone git@github.com:ibm-messaging/mq-dev-patterns.git
```

Move into the `mq-dev-patterns/transactions/JMS/Spring` directory.

```
cd mq-dev-patterns/transactions/JMS/Spring
```

## Build with Maven

Both the [request-response](/request-response) and the [simple](/simple) directories contain a 'pom.xml' configuration file that include dependencies to enable you to build or compile the samples without the need to download individual libraries.

We pull in the following

* mq-jms-spring-boot-starter with classes and beans that abstract the details for connecting to and interacting with MQ objects when using Spring. This pulls in other pre-req libraries

To compile or build, start from a root of either sample directory:

```
cd request-response
```
or
```
cd simple
```

For either sample the Maven build command is the same, run as follows:

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
We'll repeat these commands in the individual instructions README files for each of the samples.

## Try out the samples

You should now be ready to try out the samples.
Pick one and click the link for further instructions.

- [Simple Spring app with IBM MQ](simple_readme.md)
  * Transacted context
  * Commit
  * Rollback

- [Request response Spring app with IBM MQ](request-response_readme.md)
  * Transacted context on the responder/listener side
  * Use of commit and rollback


<!-- * How do I know a transaction has happened? -->
