# IBM MQ JMS samples
These JMS samples implement some basic messaging patterns, using an IBM MQ queue manager.

They use the Jakarta form of the JMS API, which is now the recommended approach for JMS applications.


## Introduction to the JMS samples
There are six basic patterns implemented as pairs in these samples: put/get, publish/subscribe and request/response. They share a
common set of classes to read the configuration and handle the connection to the queue manager. And there are other
classes shared between similar operations to reduce duplication.

The core classes will usually be used in pairs. They are:

* **BasicPut.java** - Puts messages onto a queue
* **BasicGet.java** - Gets messages from a queue
* **BasicPub.java** - Publishes messages to a topic
* **BasicSub.java** - Subscribes to messages from a topic
* **BasicRequest.java** - Puts a request message and waits for a reply
* **BasicResponse.java** - Waits for a request message and sends the reply

The **BasicSampleDriver.java** class is a frontend that can be used to drive all 6 operations.

There are then additional modules to provide shared functions. They include:

* **EnvSetter.java** - Used to read settings from a configuration file or from system properties
* **ConnectionHelper.java** - Manages the connection to the queue manager
* **BasicConsumer.java** - Consumes messages from a queue or publications from a topic
* **BasicProducer.java** - Sends messages either to a queue or publications to a topic
* **LoggingHelper.java** - Implements a simple log strategy to report progress
* **JwtHelper.java** - Use JWT tokens for authentication. Obtain the token from a configured server.

The location and name of the configuration file defaults to `../env.json`. This can be overriden by setting the
environment variable or system property `EnvFile`.

## Building and running the samples

A _pom.xml_ file is provided allowing you to use maven to download dependencies and build the samples. The simplest
execution will create a single jar file containing all the dependencies, ready to run directly. The optional
`-DskipTests` flag bypasses running any unit tests in the tree.

```
mvn clean package -DskipTests
```

You can then run the programs, specifying which of the 6 operations you want. Optionally nominate a configuration file
as well:

````
java -DEnvFile=../env.json -jar target/mq-dev-patterns-jakarta-0.1.0.jar put
````

If the configuration file is not found then you can also provide values as properties on the command line. The MQCCDTURL
property is likely to be needed:

````
java -DEnvFile=../env-not-found.json \
     -DQMGR=QM1 -DAPP_USER=app  \
     -DAPP_PASSWORD=app-passw0rd \
     -DQUEUE_NAME=DEV.QUEUE.1 \
     -DMQCCDTURL=file:///location/ccdt.json \
     -jar target/mq-dev-patterns-jakarta-0.1.0.jar put
````

The version in the jar name (`0.1.0`) is defined in the _pom.xml_ file.

Output is logged in the console:
```
[12:10:22] [INFO   ] BasicSampleDriver   : Requested operation is "put"
[12:10:22] [INFO   ] BasicSampleDriver   : Processing put/publish options
[12:10:22] [INFO   ] BasicSampleDriver   : Will be sending 2 messages
[12:10:22] [INFO   ] BasicProducer       : Application "Basic put" is starting
[12:10:22] [INFO   ] EnvSetter           : Looking for configuration file /home/metaylor/GitHub/ibm-messaging/mq-dev-patterns/tests/env_test.json
[12:10:22] [INFO   ] EnvSetter           : File read
[12:10:22] [INFO   ] EnvSetter           : JSON Data Found
[12:10:22] [INFO   ] EnvSetter           : There is at least one MQ endpoint in the configuration file
[12:10:22] [INFO   ] EnvSetter           : Connection string: 127.0.0.1(1413)
[12:10:22] [INFO   ] ConnectionHelper    : Connecting to 127.0.0.1(1413)
[12:10:22] [INFO   ] ConnectionHelper    : No JWT configuration found. Will not be using JWT for authentication.
[12:10:22] [INFO   ] ConnectionHelper    : Created connection factory
[12:10:22] [INFO   ] ConnectionHelper    : Created context
[12:10:23] [INFO   ] BasicProducer       : Created destination: queue:///DEV.QUEUE.1?targetClient=1
[12:10:23] [INFO   ] BasicProducer       : Sending messages.
[12:10:23] [INFO   ] BasicProducer       : Message was sent
[12:10:25] [INFO   ] BasicProducer       : Sending messages.
[12:10:25] [INFO   ] BasicProducer       : Message was sent

```

### Running the samples.
The main class in the uber-jar is `com.ibm.mq.samples.jms.BasicSampleDriver`, which will call each of the operations as
needed. When sending messages, you can pass a parameter saying how many should be sent.

For example, to put 6 messages run:
````
java -jar target/mq-dev-patterns-jakarta-0.1.0.jar put 6
````

To get the messages run:
````
java -jar target/mq-dev-patterns-jakarta-0.1.0.jar get
````

The valid operations are `put`, `get`, `pub`, `sub`, `req`, `rsp`.

Both the pub/sub and request/response pairs should be run in two terminals as they interact.

It is also possible to invoke the different operations directly, putting the jar file on the classpath and naming the
relevant class. For example:
````
java -cp target/mq-dev-patterns-jakarta-0.1.0.jar com.ibm.mq.samples.jms.BasicPut
````

## Publish / Subscribe
You have to run the subscriber sample first so it creates a subscription and waits for a publication.

Open two terminals.

In the first terminal:
````
java -jar target/mq-dev-patterns-jakarta-0.1.0.jar sub
````

Then run the publisher sample is the other terminal:
````
java -jar target/mq-dev-patterns-jakarta-0.1.0.jar pub 2
````

## Request / Response
You have to run the responder sample first, so it is waiting for the request message.

Open two terminals.

In the first terminal;
````
java -jar target/mq-dev-patterns-jakarta-0.1.0.jar rsp
````

In the second terminal:
````
java -jar target/mq-dev-patterns-jakarta-0.1.0.jar req
````

## Connections
### Run the samples with TLS

To run the samples with TLS you need to provide additional arguments. Add these properties to the execution:
```
-Djavax.net.ssl.trustStoreType=jks
-Djavax.net.ssl.trustStore=/your_key_directory/clientkey.jks
-Djavax.net.ssl.trustStorePassword=<your_keystore_pw>
```

Depending on your queue manager and channel configuration, you might also need to set the equivalent `keyStore`
properties.

### Bindings mode

By default these samples will run in client mode. If you do want to run the samples in `bindings` mode, without using
channels, then add

````
    "BINDINGS": true
````

to the configuration file.

### Authentication

Authentication to the queue manager will normally be done by setting the `APP_USER` and `APP_PASSWORD` properties. You
can also use JWT-based authentication by setting the `JWT_ISSUER` options in the configuration file. The configuration
can use either a username/password mecahnism (the `JWT_TOKEN_USERNAME` and `JWT_TOKEN_PWD` attributes) or the
now-preferred approach of using a client secret (the `JWT_TOKEN_CLIENTSECRET` value).

## Additional scripts

### Running multiple instances

The `scripts` folder contains the `multi-jms-sample-driver.sh` script which enables you to run multiple instances of a
JMS application. By default, the script will run 6 instances of the `put` operation. To change this you can supply the
operation name and the number of instances when you run the script as below from the `scripts` folder

`./multi-jms-sample-driver.sh <operation> <number_of_instances>`

The script will run with the defaults if these values aren't specified.

You can also export a CCDT for the JMS application to use as below

`export MQCCDTURL=file:///<your_CCDT_file>`

## Test cases
The samples also contain some limited unit tests in `src/test`. These tests use the default `env.json` present in the
repository. The tests here are primarily used to demonstrate how test cases can be integrated in the maven tree.
Additional basic tests used to drive the real programs are provided in the _tests/test-jms.sh_ file under the root of
this repository.

To run these tests, Use the following command:

````
mvn test
````
