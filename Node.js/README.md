# IBM MQ Node.js samples
The Node.js samples are based on https://github.com/ibm-messaging/mq-mqi-nodejs/tree/master/samples
and have been built and tested with Node.js v18.20.8 and v22.14.0


Install/unzip IBM MQ client

## Mac

[IBM MQ MacOS toolkit for developers download](https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/mactoolkit/)

Add
`/opt/mqm/bin` and
`/opt/mqm/samp/bin`, to the PATH by editing `/etc/paths`

`export DYLD_LIBRARY_PATH=/opt/mqm/lib64`

`export MQ_INSTALLATION_PATH=/opt/mqm`

## Windows

[Windows client v 9.1.1.0 download](https://www-945.ibm.com/support/fixcentral/swg/selectFixes?parent=ibm~WebSphere&product=ibm/WebSphere/WebSphere+MQ&release=9.1.1&platform=Windows+64-bit,+x86&function=fixId&fixids=9.1.1.0-IBM-MQC-Win64+&useReleaseAsTarget=true&includeSupersedes=0)


## Linux

[Linux Ubuntu client v 9.1.1.0 download](https://www-945.ibm.com/support/fixcentral/swg/selectFixes?parent=ibm~WebSphere&product=ibm/WebSphere/WebSphere+MQ&release=9.1.1&platform=Linux+64-bit,x86_64&function=fixId&fixids=9.1.1.0-IBM-MQC-UbuntuLinuxX64+&useReleaseAsTarget=true&includeSupersedes=0)

To run the examples cd to the Node.js directory and install the
prerequsites by running :

`npm install`

## Intro to Node.js Samples

### Stand alone Node.js samples

**basicput.js** - Puts message to a queue

**basicget.js** - Gets message from a queue

**basicsubscribe.js** - Subscribes to a topic string and gets publications/messages

**basicpublish.js** - Publishes messages to a topic string

**basicrequest.js** - Puts a message on a request queue and waits for a response

**basicresponse.js** - Gets message from a request queue, does something with the message and puts it to the reply queue.


### Refactored samples to reduce duplication

**sampleput.js** - Puts message to a queue

**sampleget.js** - Gets message from a queue

**samplesubscribe.js** - Subscribes to a topic string and gets publications/messages

**samplepublish.js** - Publishes messages to a topic string

**samplerequest.js** - Puts a message on a request queue and waits for a response

**sampleresponse.js**- Gets message from a request queue, does something with the message and puts it to the reply queue.

***boilerplate.js*** - Common class, manages the connection to queue manager, contains generic consumer and producer code.

The location and name of the env.json file defaults
to `../env.json`. This can be overriden by setting the environment option `EnvFile`. Before running the samples, export the path to the JSON file as shown below:

````
export EnvFile="../../envfile.json"
````


### Running refactored samples with JWT authentication

To enable token-based authentication, ensure you have a configured token issuer and queue manager [JWT README](jwt-jwks-docs/README.md) and then edit the `JWT_ISSUER` block in the env.json file

```JSON
"JWT_ISSUER" : [{
    "JWT_TOKEN_ENDPOINT":"https://<KEYCLOAK_URL>/realms/master/protocol/openid-connect/token",
    "JWT_TOKEN_USERNAME":"app",
    "JWT_TOKEN_PWD":"passw0rd",
    "JWT_TOKEN_CLIENTID":"admin-cli",
    "JWT_KEY_REPOSITORY": "path/to/tokenIssuerKeystore"
  }]
```
For JWT authentication via JWKS, make sure `JWT_KEY_REPOSITORY` points to your token issuer's public certificate and your queue manager is configured to retrieve the JWKS

If you would like to proceed with JWT authentication without JWKS validation, edit the endpoint to use the correct URL (beginning with http) and leave `JWT_KEY_REPOSITORY` blank

## Put / Get
The put application places a json object onto the queue.
To run the basic application with logging, run

On Mac and Linux:

`DEBUG=amqs*:* node basicput.js`

On Windows:
````
SET DEBUG=amqs*:*
node basicput.js
````

The get application reads a json object from the queue.

To run the basic application with logging, run

On Mac and Linux:

`DEBUG=amqs*:* node basicget.js`

On Windows:
````
SET DEBUG=amqs*:*
node basicget.js
````

The sample get and put applications have the common MQ boiler plate
factorised into a library and make use of
promises.

To run with logging, run

On Mac and Linux: <br>
`DEBUG=sample*:*,boiler:* node sampleput.js` <br>
and <br>
`DEBUG=sample*:*,boiler:* node sampleget.js`

On Windows:
````
SET DEBUG=sample*:*,boiler:*
node sampleput.js
````
and
````
SET DEBUG=sample*:*,boiler:*
node sampleget.js
````

To set the application name, which is useful for problem determination, `SET` the envrionment variable `ApplName`. eg.
On Mac and Linux: <br>
`DEBUG=sample*:*,boiler:* ApplName="sample put app" node sampleput.js` <br>
and <br>
`DEBUG=sample*:*,boiler:* ApplName="sample get app" node sampleget.js`


## Publish / Subscribe
The publish application publishes a json object onto a topic.
To run the basic applications with logging, run

On Mac and Linux: <br>
`DEBUG=amqs*:* node basicpublish.js`

On Windows:
````
SET DEBUG=amqs*:*
node basicpublish.js
````

The subscribe application subscribes to a
topic.

To run with logging, run

On Mac and Linux: <br>
`DEBUG=amqs*:* node basicsubscribe.js`

On Windows:
````
SET DEBUG=amqs*:*
node basicsubcscribe.js
````

The sample publish and subscribe applications have the common MQ boiler plate
factorised into a library and makes use of
promises.

To run with logging, run

On Mac and Linux <br>
`DEBUG=sample*:*,boiler:* node samplepublish.js`

and

`DEBUG=sample*:*,boiler:* node samplesubscribe.js`

It is possible to set the application name, by setting the environment value `ApplName`.

To create a durable subscription set the envrionment variable `DURABLE` to any value. eg.

`DEBUG=sample*:*,boiler:* DURABLE=1 ApplName="sample durable subscriber" node samplesubscribe.js`

On Windows:
````
SET DEBUG=sample*:*,boiler:*
node samplepublish.js
````
and
````
SET DEBUG=sample*:*,boiler:*
node samplesubscribe.js
````


## Request / Response
The request application create a dynamic queue for a reply, and
places a json object consisting of the request onto a queue, then waits
for a response to the request.

To run the basic applications with logging, run

On Mac and Linux:

`DEBUG=amqs*:* node basicrequest.js`

and

`DEBUG=amqs*:* node basicresponse.js`

On Windows:
````
SET DEBUG=amqs*:*
node basicrequest.js
````
and
````
SET DEBUG=amqs*:*
node basicresponse.js
````
The request / response applications have the common MQ boiler plate
factorised into a library and makes use of
promises.

To run the sample applications with logging, run

On Mac and Linux:

`DEBUG=sample*:*,boiler:* node sampleresponse.js`

and

`DEBUG=sample*:*,boiler:* node samplerequest.js`

On Windows:
````
SET DEBUG=sample*:*,boiler:*
node sampleresponse.js
````

and

````
SET DEBUG=sample*:*,boiler:*
node samplerequest.js
````

It is possible to set the application name, by setting the environment value `ApplName`.
