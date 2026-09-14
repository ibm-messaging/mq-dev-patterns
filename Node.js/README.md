# IBM MQ Node.js samples
The Node.js samples are based on a selection from
[here](https://github.com/ibm-messaging/mq-mqi-nodejs/tree/master/samples). Additional examples can be found in that
repository.

You must first install the IBM MQ C client SDK. You may also need a C++ compiler to build the add-on library that
interfaces between the Node engine and the MQ C libraries.

## MQ Client installation
### Windows and Linux

The latest MQ Redistributable client packages can be downloaded from
[here](https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/redist).
* The Windows package is named `version`-IBM-MQC-Redist-Win64.zip
  * For simplicity, this file should be unpacked into _C:\Program Files\IBM\MQ_. The main MQI header file should then be
    at _C:\Program Files\IBM\MQ\Tools\C\Include\cmqc.h_
* The Linux package is named `version`-IBM-MQC-Redist-LinuxX64.tar.gz
  * For simplicity, this file should be unpacked into _/opt/mqm_. The main MQI header file should then be at
    _/opt/mqm/inc/cmqc.h_

### MacOS

See [MacOS Toolkit](https://ibm.biz/mq-mac-toolkit)

* Add `/opt/mqm/bin` and `/opt/mqm/samp/bin` to the PATH by editing `/etc/paths`
* Also `export DYLD_LIBRARY_PATH=/opt/mqm/lib64`

### Other platforms
The full MQ client packages can be downloaded from [FixCentral](https://www.ibm.com/support/fixcentral/swg/)

## The sample programs

### Introduction
To run the examples, go to the Node.js directory and install the prerequsites by running: `npm install`

* **sampleput.js** - Puts message to a queue
* **sampleget.js** - Gets message from a queue
* **samplesubscribe.js** - Subscribes to a topic string and gets publications/messages
* **samplepublish.js** - Publishes messages to a topic string
* **samplerequest.js** - Puts a message on a request queue and waits for a response
* **sampleresponse.js**- Gets message from a request queue, does something with the message and puts it to the reply queue.
* **boilerplate.js** - Common class, manages the connection to queue manager, contains generic consumer and producer code.

The location and name of the env.json file defaults to `../env.json`. This can be overriden by setting the environment
option `EnvFile`. Before running the samples, export the path to the JSON file as shown below:

````
export EnvFile="../../envfile.json"
````

### Running samples with JWT authentication

To enable token-based authentication, ensure you have a configured token issuer and queue manager [JWT
README](jwt-jwks-docs/README.md) and then edit the `JWT_ISSUER` block in the env.json file

```JSON
"JWT_ISSUER" : [{
    "JWT_TOKEN_ENDPOINT":"https://<KEYCLOAK_URL>/realms/master/protocol/openid-connect/token",
    "JWT_TOKEN_USERNAME":"app",
    "JWT_TOKEN_PWD":"passw0rd",
    "JWT_TOKEN_CLIENTID":"admin-cli",
    "JWT_KEY_REPOSITORY": "path/to/tokenIssuerKeystore"
  }]
```
For JWT authentication via JWKS, make sure `JWT_KEY_REPOSITORY` points to your token issuer's public certificate and
your queue manager is configured to retrieve the JWKS

If you would like to proceed with JWT authentication without JWKS validation, edit the endpoint to use the correct URL
(beginning with http) and leave `JWT_KEY_REPOSITORY` blank

### Logging output from the samples
To get any output from the programs, set the DEBUG environment variable.

* On Mac and Linux: `export DEBUG=sample*:*,boiler:*`
* On Windows: `SET DEBUG=sample*:*,boiler:*`

Without this setting, successful executions of the program run silently.

You can also set the ApplName environment variable which may help distinguish traces.
* On Mac and Linux: `export ApplName="SamplePut"`
* On Windows: `set ApplName=SamplePut`

### Put / Get
The Put application places a json object onto the queue, while the Get application retrieves it:
```
node sampleput.js
node sampleget.js
```

### Publish / Subscribe
The publish application publishes a json object onto a topic.

You have to run the subscriber sample first so it creates a subscription and waits for a
publication. To create a durable subscription set the environment variable `DURABLE` to any value. `

Open two terminals.

In the first terminal, run: `node samplesubscribe.js`

In the second terminal, run: `node samplepublish.js`

### Request / Response
The request application creates a dynamic queue for a reply, and places a json object consisting of the request onto a
queue, then waits for a response to the request.

Open two terminals.

In the first terminal, run: `node sampleresponse.js`

In the second terminal, run:`node samplerequest.js`



