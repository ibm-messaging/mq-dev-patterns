# IBM MQ Node.js samples
The Node.js samples are based on https://github.com/ibm-messaging/mq-mqi-nodejs/tree/master/samples
and have been tested with Node.js v20.11.1


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

Connecting to MQ with TLS
---
In order to connect the samples to MQ on cloud using TLS, 
- [Follow these steps to create a keystore file of the queue manager.](https://cloud.ibm.com/docs/mqcloud?topic=mqcloud-mqoc_configure_chl_ssl#download_cert)

- In the `env.json` file, replace the value of the `KEY_REPOSITORY` with the location of your kdb file. For e.g. If you have a directory called `/keys/clientkey` with the `key.kdb` in it, the value of `KEY_REPOSITORY` would be : `KEY_REPOSITORY=/keys/clientkey/key.kdb`

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


## Put / Get
The put application places a json object onto the queue.
To run with logging, run

On Mac and Linux:

`export DEBUG=amqs*:* node basicput.js`

On Windows:
````
SET DEBUG=amqs*:*
node basicput.js
````

The get application reads a json object from the queue.

To run with logging, run

On Mac and Linux:

`export DEBUG=amqs*:* node basicget.js`

On Windows:
````
SET DEBUG=amqs*:*
node basicget.js
````

The get and put applications have the common MQ boiler plate
factorised into a library and make use of
promises.

To run with logging, run

On Mac and Linux: <br>
`export DEBUG=sample*:*,boiler:* node sampleput.js` <br>
and <br>
`export DEBUG=sample*:*,boiler:* node sampleget.js`

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


## Publish / Subscribe
The publish application publishes a json object onto a topic.
To run with logging, run

On Mac and Linux: <br>
`export DEBUG=amqs*:* node basicpublish.js`

On Windows:
````
SET DEBUG=amqs*:*
node basicpublish.js
````

The subscribe application subscribes to a
topic.

To run with logging, run

On Mac and Linux: <br>
`export DEBUG=amqs*:* node basicsubscribe.js`

On Windows:
````
SET DEBUG=amqs*:*
node basicsubcscribe.js
````

The publish and subscribe applications have the common MQ boiler plate
factorised into a library and makes use of
promises.

To run with logging, run

On Mac and Linux <br>
`export DEBUG=sample*:*,boiler:* node samplepublish.js`

and

`export DEBUG=sample*:*,boiler:* node samplesubscribe.js`

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

To run with logging, run

On Mac and Linux:

`export DEBUG=amqs*:* node basicrequest.js`

and

`export DEBUG=amqs*:* node basicresponse.js`

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

To run with logging, run

On Mac and Linux:

`export DEBUG=sample*:*,boiler:* node sampleresponse.js`

and

`export DEBUG=sample*:*,boiler:* node samplerequest.js`

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