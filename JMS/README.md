# IBM MQ JMS samples
The JMS samples are based on the the existing samples shipped with IBM MQ Server and Client packages.
These have been tested with Java(TM) SE Runtime Environment (build 1.8.0_181-b13).

Download
[latest IBM MQ allclient jar](https://search.maven.org/search?q=a:com.ibm.mq.allclient)

[JMS API 2.0.1 jar](https://search.maven.org/search?q=a:javax.jms-api)

[JSON parser json-simple](https://search.maven.org/search?q=g:com.googlecode.json-simple)

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
default the location will be:

- Windows: C:\Users\<User_Name>\.m2
- Linux: /home/<User_Name>/.m2
- Mac: /Users/<user_name>/.m2

You will need to refer to the dependencies when you run any of the samples. To simplify this process you can download the dependencies by running the maven command:

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

If you use maven to build the samples, you will not need to compile them separately.


### Running maven build samples.
To run any of the samples you will need to add the dependencies and the samples `.jar` file to the classpath. EG. To run the JmsPut sample:

````
java -cp target/mq-dev-patterns-0.1.0.jar:./javax.jms-api-2.0.1.jar:./json-simple-1.1.1.jar:./com.ibm.mq.allclient-9.2.0.0.jar com.ibm.mq.samples.jms.JmsPut
````


## Put / Get
From the top level JMS folder, compile first

`javac -cp ./com.ibm.mq.allclient-9.2.0.1.jar:./javax.jms-api-2.0.1.jar:./json-simple-1.1.1.jar:. com/ibm/mq/samples/jms/JmsPut.java`

and run

`java -cp ./com.ibm.mq.allclient-9.2.0.1.jar:./javax.jms-api-2.0.1.jar:./json-simple-1.1.1.jar:. com.ibm.mq.samples.jms.JmsPut`

In a separate terminal, from the top level JMS folder, compile first

`javac -cp ./com.ibm.mq.allclient-9.2.0.1.jar:./javax.jms-api-2.0.1.jar:./json-simple-1.1.1.jar:. com/ibm/mq/samples/jms/JmsGet.java`

and run

`java -cp ./com.ibm.mq.allclient-9.2.0.1.jar:./javax.jms-api-2.0.1.jar:./json-simple-1.1.1.jar:. com.ibm.mq.samples.jms.JmsGet`


## Publish / Subscribe
Open two terminals.

In the first terminal;

You have to run the subscriber sample first so it creates a subscription and waits for a publication.

Compile first

`javac -cp ./com.ibm.mq.allclient-9.2.0.1.jar:./javax.jms-api-2.0.1.jar:./json-simple-1.1.1.jar:. com/ibm/mq/samples/jms/JmsSub.java`

then run

`java -cp ./com.ibm.mq.allclient-9.2.0.1.jar:./javax.jms-api-2.0.1.jar:./json-simple-1.1.1.jar:. com.ibm.mq.samples.jms.JmsSub`

In the second terminal;

Run the publisher sample

Compile first

`javac -cp ./com.ibm.mq.allclient-9.2.0.1.jar:./javax.jms-api-2.0.1.jar:./json-simple-1.1.1.jar:. com/ibm/mq/samples/jms/JmsPub.java`

then run

`java -cp ./com.ibm.mq.allclient-9.2.0.1.jar:./javax.jms-api-2.0.1.jar:./json-simple-1.1.1.jar:. com.ibm.mq.samples.jms.JmsPub`

## Request / Response
Open two terminals.

In the first terminal;

Run the request sample

Compile

`javac -cp ./com.ibm.mq.allclient-9.2.0.1.jar:./javax.jms-api-2.0.1.jar:./json-simple-1.1.1.jar:. com/ibm/mq/samples/jms/JmsRequest.java`

then run

`java -cp ./com.ibm.mq.allclient-9.2.0.1.jar:./javax.jms-api-2.0.1.jar:./json-simple-1.1.1.jar:. com.ibm.mq.samples.jms.JmsRequest`

The request sample will put a message and wait for a response until it either gets a response or you `ctrl+c` interrupt it.

In the second terminal;

Run the response sample

Compile first

`javac -cp ./com.ibm.mq.allclient-9.2.0.1.jar:./javax.jms-api-2.0.1.jar:./json-simple-1.1.1.jar:. com/ibm/mq/samples/jms/JmsResponse.java`

and run

`java -cp ./com.ibm.mq.allclient-9.2.0.1.jar:./javax.jms-api-2.0.1.jar:./json-simple-1.1.1.jar:. com.ibm.mq.samples.jms.JmsResponse`

The response sample will get a message from the queue, process it and put the response on the reply to queue and keep looking for more messages to respond to till you ctrl+c interrupt it.

## The SampleEnvSetter

Used by all samples to read the JSON file. Will be compiled when you compile any other the other samples.


## The RequestCalc

Used in the request / response samples to parse messages into and out of JSON and to take the random number from the request, square it and return it in the response.

Will be compiled when you compile either request / response samples.



## Run the samples with TLS

To run the samples with TLS you need to provide additional arguments;

`java -Djavax.net.ssl.trustStoreType=jks -Djavax.net.ssl.trustStore=/your_key_directory/clientkey.jks -Djavax.net.ssl.trustStorePassword=<your_keystore_pw> -Dcom.ibm.mq.cfg.useIBMCipherMappings=false -cp ./com.ibm.mq.allclient-9.2.0.1.jar:./javax.jms-api-2.0.1.jar:./json-simple-1.1.1.jar:. com.ibm.mq.samples.jms.JmsPut`

 *A note on the* `Dcom.ibm.mq.cfg.useIBMCipherMappings=false` property

This is needed as the samples were tested in an enviroment with the Oracle JRE installed. Depending on whether you have Oracle or IBM JRE installed, you also need to name the cipher suite/spec accordingly. See the table here [TLS CipherSpecs and CipherSuites in IBM MQ classes for JMS](https://www.ibm.com/support/knowledgecenter/SSFKSJ_9.1.0/com.ibm.mq.dev.doc/q113220_.htm)
