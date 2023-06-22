## Issue Support 

The code in this repository, is provided and maintained on a community basis, and is not covered by any IBM commercial support agreement or warranty.

For issues and fixes please just raise an issue against this repository.

## IBM MQ samples and patterns 

When your application needs messaging, you don't want to spend countless hours learning the basics, you want to jump straight in and play, see how things work.

We have taken parts that make up the current set of our IBM MQ samples and built applications that you can use to do just that.

You'll find `put/get`, `pub/sub`, `request/response` samples that you can run in the same language or you can try mixing things up and do a `put` in Java, `get` with Go etc.

There is a [README for each language](#readme-docs) that helps you with the initial setup.

You need an MQ server with a queue or topic to run these samples against. To find out more about what MQ is and how it works, start from [LearnMQ](http://ibm.biz/mq-badge).

To get your MQ server set up, check out [Ready, Set, Connect](https://developer.ibm.com/series/mq-ready-set-connect/).

You can use your own MQ server, you'll just have to adjust the MQ objects accordingly so they match on both the server and the client side.

* **HOST** - Host name or IP address of your queue manager
* **PORT** - Listener port for your queue manager
* **CHANNEL** - MQ channel name
* **QMGR** - Queue manager name
* **APP_USER** - User name that application uses to connect to MQ
* **APP_PASSWORD** - Password that the application uses to connect to MQ
* **QUEUE_NAME** - Queue name for `put/get`, `request/response`
* **TOPIC_NAME** - Topic for `publish/subscribe`
* **MODEL_QUEUE_NAME** - Model Queue used as template to base dynamic queues on for `request/response`
* **DYNAMIC_QUEUE_PREFIX** - Prefix for dynamically created reply queue - you don't need to create this
* **CIPHER_SPEC** - If present in the `env,json`, TLS Cipher specification to use
* **KEY_REPOSITORY** - Path to the `keystore` `.kbd` and `.sth` files. If running on Apple Silicon then this will the path to the queue manager's exported `.pem`. If present in the `env.json`, TLS is enabled - this is on the app side.

If instead you choose to provide a client channel definition table (CCDT) file,
then the **Host**, **PORT**, **Channel** and **Cipher** are provided by the
CCDT and you can leave them out of the `env.json`. All the samples check if the
environment variable `MQCCDTURL` is set and that the file it is pointing at exists.
If it does then the logic sets the connection definition or connection factory to
for CCDT processing. For example

```
export MQCCDTURL=file:///Users/xyz/Documents/dev/mqsamples/mq-dev-patterns/ccdt.json
```

We give you a sample `ccdt.json` from which you can base your own.


If you use our MQ server for developers in Docker, Linux or Windows, with the default config, you'll have the following MQ objects on the MQ server;

~~~Text
Host - localhost
Port - 1414 - Non TLS
Channel - DEV.APP.SVRCONN
Queue manager - QM1
App user - app (member of mqclient group)
App password - passw0rd (you can set your own when running the Docker container, MQ_APP_PASSWORD)
Queue - DEV.QUEUE.1
Topic - dev/
Cipher suite - TLS_RSA_WITH_AES_128_CBC_SHA256
~~~


### Model queue and MQ container image
The default configuration for MQ objects that you get with our Docker container does not include a model queue.

We use a model queue in the `request/response` pattern as a template for the request application to create a temporary reply queue.

You can use the MQ Web Console to create the model queue. Access the MQ Web Console for your MQ running as a container at [https://localhost:9443/ibmmq/console/](https://localhost:9443/ibmmq/console/). You can log in with the [default admin details](https://github.com/ibm-messaging/mq-container/blob/4d4051312eb9d95a086e2ead76482d1f1616d149/docs/developer-config.md#web-console) or your own, if you made changes.

## Environment variables

All the samples make use of the same environment variables to define MQ connection settings - these match the default developer config objects on the MQ server.

We've tried to make this easier by providing one `env.json` file in the main `samples` directory;

```JSON
{
  "MQ_ENDPOINTS": [{
    "HOST":"localhost",
    "PORT":"1414",
    "CHANNEL":"DEV.APP.SVRCONN",
    "QMGR":"QM1",
    "APP_USER":"app",
    "APP_PASSWORD":"passw0rd",
    "QUEUE_NAME":"DEV.QUEUE.1",
    "MODEL_QUEUE_NAME":"DEV.APP.MODEL.QUEUE",
    "TOPIC_NAME":"dev/",
    "CIPHER_SUITE":"TLS_RSA_WITH_AES_128_CBC_SHA256",
    "KEY_REPOSITORY": "./keys/clientkey"
    }]
}
```

### IBM Z Xplore
If you are running these samples on IBM Z Xplore then you can use the
`env-zbindings.json` file. Simply rename the `env-zbindings.json` to 
`env.json`

You can use the `env.json` file to 'switch on' or 'switch off' parts of the code.

## Endpoints Array
Having the endpoints defined as an array allows us to define multiple endpoints
for the sample applications to use.  

## TLS

For example, removing the CIPHER_SUITE and KEY_REPOSITORY lines (don't forget to remove the comma from the last line in the json)
will mean the sample will connect without using TLS.

If you have two docker containers, one with TLS and one without, changing the port number in the `env.json` allows you to switch between them.

### Apple Silicon

The IBM MQ Client Toolkit on Apple Silicon (ARM64) makes use of OpenSSL libraries
for TLS. For the MQI based samples in this repository, this means that
`KEY_REPOSITORY` in the `env.json` file or environment
variable `KEY_REPOSITORY` be set to the path for the queue manager's exported `.pem` file. eg. If you have exported the `qmgrcert.pem` file to the root directory of this repository, then set `KEY_REPOSITORY` to `../qmgrcert.pem` .


### Using port forwarding to run a multiple containers

Let's say you're already running MQ in a Docker container without TLS having set it up by following the [Ready, Set, Connect](https://developer.ibm.com/series/mq-ready-set-connect/) tutorial.

Now you want to run the second Docker container to try the samples with TLS switched on.

You can have the same MQ objects set up in both, and switch between them by using the host port forwarding to make the non TLS queue manager available on port 1414 and the TLS one on port 1415.

### Creating self signed certificates by using `openssl`

Do this in a directory you'll easily remember as you'll have to copy the server certificates over into a temporary folder each time you need to run MQ with TLS in a Docker container.

You'll also have to point to the client keystore location from the `env.json` file so that if you want to run samples with TLS, the sample knows where to look.

1. Create a new directory. Navigate inside this and generate a self-signed server key and certificate

   `openssl req -newkey rsa:2048 -nodes -keyout key.key -x509 -days 365 -out key.crt`

   An RSA private key will be generated and you'll need to complete information that will go inside the self signed certificate.

   **IMPORTANT: this directory should initially be empty.**

2. Verify that the certificate has been created successfully

   `openssl x509 -text -noout -in key.crt`

   When done, you'll see the certificate data output.

3. Create a client keystore.

 - For **JMS and XMS** based clients, create a .jks client keystore and create and verify a keystore password:

    `keytool -keystore clientkey.jks -storetype jks -importcert -file key.crt -alias server-certificate`

 - For MQI based Clients (**Node, Python, Go**)

    Create a key database, a stash file. You will need to have installed the MQI client, so that you can run the runmqakm tool:

    `runmqakm -keydb -create -db clientkey.kdb -pw tru5tpassw0rd -type pkcs12 -expire 1000 -stash`

    Import the server's public key certificate into the client key database

    `runmqakm -cert -add -label QM1.cert -db clientkey.kdb -pw tru5tpassw0rd -trust enable -file key.crt`

4. Move the client keystore

- Move the client keystore somewhere you will remember. Ensure the only files in the current directory are the `key.key` and `key.crt` files, as IBM MQ will use the contents of this directory to configure security inside the container.

5. Run the new docker container

    Give it a name, for example `mqtls` so you can differentiate it from your other MQ container when you `docker ps`, and point it at the location where you copied the server certificate.

    `docker run --name mqtls --env LICENSE=accept --env MQ_QMGR_NAME=QM1 --volume ___PATH TO SERVER_KEY/CERTIFICATE DIRECTORY___:/etc/mqm/pki/keys/mykey --publish 1415:1414 --publish 9444:9443 --detach --env MQ_APP_PASSWORD=passw0rd icr.io/ibm-messaging/mq:latest`

    Remember to use a secure password for `MQ_APP_PASSWORD`.

You should be able to open the MQ Web console for this TLS container on https://localhost:9444/ibmmq/console.

If you choose to stop the container, check the ID or name of the TLS container that was running previously with:

`docker ps -a`

then run

`docker start <container id or name>`

to start the container again.

## MQI Paths
The MQI samples; `Node.js`, `Python`, `Go`, require the MQI Client Toolkit to have been
installed and the paths

`MQ_INSTALLATION_PATH` and

`DYLD_LIBRARY_PATH` (MacOS) or `LD_LIBRARY_PATH` (Windows or Linux) set.

If you have installed the MQI client manually, ensure that

`MQ_INSTALLATION_PATH` is set to the root directory of your MQI Client installation and

`DYLD_LIBRARY_PATH` or `LD_LIBRARY_PATH` is set to `$MQ_INSTALLATION_PATH\lib64`.

Do not install any application requirements until

`MQ_INSTALLATION_PATH` and

`DYLD_LIBRARY_PATH` or `LD_LIBRARY_PATH` are set and exported (see language README docs for more info).

## README docs

### Language based MQI / JMS / XMS samples
#### [Node.js](/Node.js/README.md)
#### [JMS](/JMS/README.md)
#### [Python](/Python/README.md)
#### [C# .Net](/dotnet/README.md)
#### [Go](/Go/README.md)

### REST samples
#### [Rust](/Rust-REST/README.md)
#### [Swift](/Swift-REST/README.md)
#### [react.js](/reactjs/README.md)

### AMQP samples
#### [QPID](/amqp-qpid/README.md)

### Transaction samples
#### [JMS](/transactions/JMS/SE/README.md)
#### [Spring](/transactions/JMS/Spring/README.md)

### Framework samples
#### [Spring](/Spring-JMS/README.md)
#### [Transactions on Spring](/transactions/JMS/Spring/README.md)
#### [Quarkus](/amqp-qpid/qpid-quarkus/README.md)

### Reactive samples
#### [Vert.x](/reactive/amqp-vertx/README.md)

### Serverless samples
#### [AWS Lambda](/serverless/aws-lambda-rest/README.md)
#### [Azure Functions](/serverless/azure-functions-rest-http-trigger/README.md)
#### [Code Engine](/serverless/codeengine/README.md)
#### [OpenWhisk Cloud Functions](/serverless/openwhisk/README.md)

### Showcase app
#### [Showcase](/ibm-messaging-mq-cloud-showcase-app/README.md)

### Kubernetes samples
#### [Scaling with Keda](Go-K8s/README.md)

### MQ container deployment examples
#### [compose](/container/queuemanager/compose/README.md)


