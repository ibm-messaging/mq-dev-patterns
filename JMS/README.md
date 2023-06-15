# IBM MQ JMS samples
The JMS samples are based on the the existing samples shipped with IBM MQ Server and Client packages.
These have been tested with Java(TM) SE Runtime Environment (build 1.8.0_181-b13).

Download
[latest IBM MQ allclient jar](https://search.maven.org/search?q=a:com.ibm.mq.allclient)

[JMS API 2.0.1 jar](https://search.maven.org/search?q=a:javax.jms-api)

[JSON parser](https://central.sonatype.com/artifact/org.json/json/20230227)

Add the jars to the top level JMS folder, these commands will then work

## Intro to JMS Samples

### Stand alone JMS samples

**JmsPut.java** - Puts message to a queue

**JmsGet.java** - Gets message from a queue

**JmsSub.java** - Subscribes to a topic string and gets publications/messages

**JmsPub.java** - Publishes messages to a topic string

**JmsRequest.java** - Puts a message on a request queue and waits for a response

**JmsResponse.java** - Gets message from a request queue, does something with the message and puts it to the reply queue.

**RequestCalc.java** - Builds string for message for JmsRequest, does the calculation for the JmsResponse.

**SampleEnvSetter.java** - Used by all stand alone samples to read the variable from the env.json. Used by the decoupled samples through the ConnectionHelper.
Encapsulates the reading of MQ environment variables and allows all the samples to use a common set.



### Refactored samples to reduce duplication

***BasicConsumer.java*** - Common class to receive messages and publications

**BasicGet.java** - Gets messages from a queue

**BasicSub.java** - Subscribes to messages from a topic

***BasicProducer.java*** - Common class to send messages and publications

**BasicPut.java** - Puts messages onto a queue

**BasicPub.java** - Publishes messages to a topic

**Helper Classes**

***ConnectionHelper.java*** - Manages the connection to MQ

***ConsumerHelper.java*** - Common class to act on received messages

***LoggingHelper.java*** - Common class to set up logging options

For TLS info, see the end of this document.

## Maven
A maven `pom.xml` is provided allowing you to use maven to download dependancies and build the samples. A symbolic link links the maven required `./src/main/java/com` directory to the `./com` directory.

### Downloading dependencies with maven
Whenever you build the samples with maven the dependencies will be downloaded and stored in your local maven repository. You can override this location, but by
default the repository location will be:

- Windows: C:\Users\<User_Name>\.m2\repository
- Linux: /home/<User_Name>/.m2/repository
- Mac: /Users/<user_name>/.m2/repository

The maven build has been configured to create an uber jar containing all dependencies, but if you need the jar files in a more convenient location you can run the maven command:

````
mvn dependency:copy-dependencies -DoutputDirectory=.
````
Which will download and copy the dependencies into the current directory.


### Building the samples with maven
You can build the samples by running the command.

````
mvn clean package
````
The `clean` option will clear out any previous build.
The build will create a ./target/mq-dev-patterns-0.1.0.jar file containing the
compiled samples.

The package phase in the `pom.xml` includes `maven-shade-plugin` which will
create an uber `.jar` file containing all dependencies.

If you use maven to build the samples, you will not need to compile them separately.


### Running maven built samples.
The main class in the uber jar is `com.ibm.mq.samples.jms.BasicSampleDriver`, which will run the basic put / get and pub / sub samples.

To put 6 messages run:
````
java -jar target/mq-dev-patterns-0.1.0.jar put 6
````

To get the messages run:
````
java -jar target/mq-dev-patterns-0.1.0.jar get
````

To publish 5 messages run:
````
java -jar target/mq-dev-patterns-0.1.0.jar pub 5
````

To subscribe run:
````
java -jar target/mq-dev-patterns-0.1.0.jar sub
````

To run any of the samples you can specify the `.jar` file as the classpath.
EG. To run the JmsPut sample:

````
java -cp target/mq-dev-patterns-0.1.0.jar: com.ibm.mq.samples.jms.JmsPut
````


## Put / Get
From the top level JMS folder, compile first

`javac -cp ./com.ibm.mq.allclient-9.2.5.0.jar:./javax.jms-api-2.0.1.jar:./json-20230227.jar:. com/ibm/mq/samples/jms/JmsPut.java`

and run

`java -cp ./com.ibm.mq.allclient-9.2.5.0.jar:./javax.jms-api-2.0.1.jar:./json-20230227.jar:. com.ibm.mq.samples.jms.JmsPut`

If you have used maven to build the samples, you can run

`java -cp target/mq-dev-patterns-0.1.0.jar: com.ibm.mq.samples.jms.JmsPut`


In a separate terminal, from the top level JMS folder, compile first

`javac -cp ./com.ibm.mq.allclient-9.2.5.0.jar:./javax.jms-api-2.0.1.jar:./json-20230227.jar:. com/ibm/mq/samples/jms/JmsGet.java`

and run

`java -cp ./com.ibm.mq.allclient-9.2.5.0.jar:./javax.jms-api-2.0.1.jar:./json-20230227.jar:. com.ibm.mq.samples.jms.JmsGet`

If you have used maven to build the samples, you can run

`java -cp target/mq-dev-patterns-0.1.0.jar: com.ibm.mq.samples.jms.JmsGet`

## Publish / Subscribe
Open two terminals.

In the first terminal;

You have to run the subscriber sample first so it creates a subscription and waits for a publication.

Compile first

`javac -cp ./com.ibm.mq.allclient-9.2.5.0.jar:./javax.jms-api-2.0.1.jar:./json-20230227.jar:. com/ibm/mq/samples/jms/JmsSub.java`

then run

`java -cp ./com.ibm.mq.allclient-9.2.5.0.jar:./javax.jms-api-2.0.1.jar:./json-20230227.jar:. com.ibm.mq.samples.jms.JmsSub`

If you have used maven to build the samples, you can run

`java -cp target/mq-dev-patterns-0.1.0.jar: com.ibm.mq.samples.jms.JmsSub`

In the second terminal;

Run the publisher sample

Compile first

`javac -cp ./com.ibm.mq.allclient-9.2.5.0.jar:./javax.jms-api-2.0.1.jar:./json-20230227.jar:. com/ibm/mq/samples/jms/JmsPub.java`

then run

`java -cp ./com.ibm.mq.allclient-9.2.5.0.jar:./javax.jms-api-2.0.1.jar:./json-20230227.jar:. com.ibm.mq.samples.jms.JmsPub`

If you have used maven to build the samples, you can run

`java -cp target/mq-dev-patterns-0.1.0.jar: com.ibm.mq.samples.jms.JmsPub`

## Request / Response
Open two terminals.

In the first terminal;

Run the request sample

Compile

`javac -cp ./com.ibm.mq.allclient-9.2.5.0.jar:./javax.jms-api-2.0.1.jar:./json-20230227.jar:. com/ibm/mq/samples/jms/JmsRequest.java`

then run

`java -cp ./com.ibm.mq.allclient-9.2.5.0.jar:./javax.jms-api-2.0.1.jar:./json-20230227.jar:. com.ibm.mq.samples.jms.JmsRequest`


If you have used maven to build the samples, you can run

`java -cp target/mq-dev-patterns-0.1.0.jar: com.ibm.mq.samples.jms.JmsRequest`

The request sample will put a message and wait for a response until it either gets a response or you `ctrl+c` interrupt it.

If you set the envrionment variable `REPLY_QUEUE_NAME` then the reply to queue will be set 
to that queue, otherwise a temporary queue is created. 

In the second terminal;

Run the response sample

Compile first

`javac -cp ./com.ibm.mq.allclient-9.2.5.0.jar:./javax.jms-api-2.0.1.jar:./json-20230227.jar:. com/ibm/mq/samples/jms/JmsResponse.java`

and run

`java -cp ./com.ibm.mq.allclient-9.2.5.0.jar:./javax.jms-api-2.0.1.jar:./json-20230227.jar:. com.ibm.mq.samples.jms.JmsResponse`

If you have used maven to build the samples, you can run

`java -cp target/mq-dev-patterns-0.1.0.jar: com.ibm.mq.samples.jms.JmsResponse`

The response sample will get a message from the queue, process it and put the response on the reply to queue and keep looking for more messages to respond to till you ctrl+c interrupt it.

If you set the envrionment variable `RESPONDER_INACTIVITY_TIMEOUT` to a number the responder will wait `RESPONDER_INACTIVITY_TIMEOUT` seconds for a request before timing out and ending.

## The SampleEnvSetter

Used by all samples to read the JSON file. Will be compiled when you compile any other the other samples.


## The RequestResponseHelper

Used in the request / response samples to parse messages into and out of JSON. 
Will be compiled when you compile either request / response samples.

The message content to be posted can be controlled by the envionment option `REQUEST_MODE`. 

EG. 

`java -DREQUEST_MODE="REWARDS" -cp target/mq-dev-patterns-0.1.0.jar: com.ibm.mq.samples.jms.JmsRequest`

A `REQUEST_MODE` of `REWARDS` sends messages posting reward points to a customer id. 
Any other value for `REQUEST_MODE` runs in default mode where the request sends a 
random number, which is squared and returned in the response.


## Run the samples with TLS

To run the samples with TLS you need to provide additional arguments;

`java -Djavax.net.ssl.trustStoreType=jks -Djavax.net.ssl.trustStore=/your_key_directory/clientkey.jks -Djavax.net.ssl.trustStorePassword=<your_keystore_pw> -Dcom.ibm.mq.cfg.useIBMCipherMappings=false -cp ./com.ibm.mq.allclient-9.2.5.0.jar:./javax.jms-api-2.0.1.jar:./json-20230227.jar:. com.ibm.mq.samples.jms.JmsPut`

 *A note on the* `Dcom.ibm.mq.cfg.useIBMCipherMappings=false` property

This is needed as the samples were tested in an enviroment with the Oracle JRE installed. Depending on whether you have Oracle or IBM JRE installed, you also need to name the cipher suite/spec accordingly. See the table here [TLS CipherSpecs and CipherSuites in IBM MQ classes for JMS](https://www.ibm.com/support/knowledgecenter/SSFKSJ_9.1.0/com.ibm.mq.dev.doc/q113220_.htm)

## Bindings mode

By default these samples will run in client mode. If you do want to run the samples in `bindings` mode, then add 

````
    "BINDINGS": true
````

to the `env.json` file.