# mq-app-code-engine
The Code Engine sample apps are Node.js applications and have been tested with Node v12.16.3, and the cloud native buildpack.

## The Code Engine Application
The application can be found in the folder `clientapp`. The structure is designed to run as a cloud native buildpack app, but can be run locally.

### server.js
This is the file that the cloud native buildpack will run. It is largely Node.js HTTP app boilerplate, and pulls in `mqapp.js`

### mqapp.js
This file is largely Node.js Express boilerplate. Web and API routes are defined in `approutes.js`

### approutes.js
This file sets up routes for 3 webpages and 3 APIs. The routes uses  `mqclient.js` to make MQ calls.


**/** (Home Page)
: Shows application version.

**/mqput**
: Shows a form that puts a number of messages onto a queue.

**/mpget**
: Shows a form that gets a number of messages from a queue.

**/api/mqput**
: API route that the mqput page uses to put messages onto a queue.

**/api/mqgetby**
: API route that the mqget page uses to get messages from a queue.

**/api/mqgetbyid**
: API route that is used to get a message with a specific message id.

### mqclient.js
This file contains the class `MQClient` with nominally 4 public methods.

- put
- get
- getById
- browse

The pattern for each of these methods is the same, using a series of common private methods

- If there isn't an open connection, connect to MQ
- Perform an action
- Check for errors

## The Event Emitter
The Event Emitter can be found in the folder `eventemitter`.

As Code Engine applications will scale to zero when not used, they can be woken by invoking any route that they are listening to. Message processing apps need to be woken when there is a message for them to process. The Event Emitter browses for messages, and invokes the `/api/mqgetbyid` for its registered endpoint.

It is possible to run the Event Emitter as a Code Engine application, but it is always running, and listening for messages, so best to run elsewhere.

You can run it from the command line:

````
DEBUG=mqapp* REG_ENDPOINT=https://<your appendpoint> node server.js
````

### server.js
This is the entry point to the application.

### mqevents.js
This sets up a 8 second loop, in which the next message on the queue is read. If a message is found an `mqevent` is signalled.

### mqlistener.js
This listens for a `mqevent`, when it invokes the registered endpoint. As the
emitter app is only informing the endpoint that there is a message for it to
process, it only expects a simple notification that the event was received.

### mqclient.js
This is, via a symbolic link, the same `MQClient` used by the code engine application.


## QueueManager
The application requires a QueueManager. You can create one in the cloud eg [IBM MQ on IBM Cloud](https://cloud.ibm.com/catalog/services/mq).

### TLS
QueueManagers on IBM Cloud are TLS enabled by default. When connecting applications need to trust the signer of your QueueManager's MQ public key. The keys that are provided in this repo contain the signer's public key. If you are connecting to IBM MQ on IBM Cloud then no changes are required. Otherwise you may need to add a signer certificate to the client trust store.

### MQ Credentials
You will need MQ application credentials for your code engine application. Obtain these credentials from your QueueManager instance in the cloud.  

## Container Registry
Code Engine applications are built from container images. You will need
a container registry in which to push and pull your application images. You can use [Container Registry in IBM Cloud](https://cloud.ibm.com/registry/start). You will need to create a namespace.


## Code Engine
To deploy and run the application you will need

* [IBM MQ QueueManager](https://cloud.ibm.com/catalog/services/mq)
* [Container Registry](https://cloud.ibm.com/registry/start)
* [Code Engine Project](https://cloud.ibm.com/codeengine) -
* [Application Source code repository](https://github.com/ibm-messaging/mq-dev-patterns/tree/master/serverless/codeengine/clientapp)

The Code Engine UI allows you to Run this application direct from source. Under the covers it performs an Image Build before it runs the application.

### Image Build
There is no dockerfile provided, as the code is cloud native buildpack compatible.

- If you don't already have one create a new [Code Engine project](https://cloud.ibm.com/codeengine/projects).
- Select your Code Engine project.
- Enable logging
- Select `Image builds`
- Create a new image build with the following settings:
   * **Code repo URL** - https://github.com/ibm-messaging/mq-dev-patterns
   * **Branch name** - master
   * **Context directory** - serverless/codeengine/clientapp
   * **Strategy** - Cloud Native Buildpack
   * **Registry Access** eg:
      - **Registry server** - eg. us.icr.io (for IBM Cloud Dallas)
      - **Registry access**
      - **Namespace**
      - **image name**
- Submit the build   

Once the build is complete, you will see a new image in your registry. Wait until its security status is "No issues".

### Application secrets and configmaps
The application has a `env.json` file which it uses to read in the required MQ connection configuration. You can override these with secrets and configmaps.
- Select your Code Engine project.
- Select `Secrets and configmaps`
  * Secrets
    - Click on `Create`
    - Select `Secret`
    - Add key-value pairs for
      * **APP_USER**
      * **APP_PASSWORD**
    - Click on `Create`
  * ConfigMap
    - Click on `Create`
    - Select `Configmap`
    - Add key-value pairs to match your MQ QueueManger for
      * **HOST**
      * **MQ_PORT** **Note:** PORT (default 8080) is used by the application for its web routes and APIs.
      * **QMGR**
    - Add key-value pairs for any other `env.json` settings you wish to override.
    - Click on `Create`

### Application Create
- Select your Code Engine project.
- Select `Applications`
- Click on `Create`
- Create a new application with the following settings:
  * **Container image**
  * **Configure image** - click on this button to select the registry, namespace and image
  * **Environment variables** - add MQ credential secrets and connection overrides.

### Application URL
From the Code Engine UI
- Select your running application.
- Click on `Test application`
- Click on `Application URL`

The application will scale down to zero instances, when there is no traffic. The home URL opens up a home web page with a `Pages` menu option, where you can open up the put and get forms.

### Viewing application logs
To view application logs from your desktop, you will need to [set up the cli](https://cloud.ibm.com/docs/codeengine?topic=codeengine-install-cli)

Once the CLI is set up you:
- Open a command line terminal
- Login to IBM Cloud
  * `ibmcloud login`
- Select your Code Engine project
  * `ibmcloud ce project select --name <project name>`
- Show the application logs
  * `ibmcloud ce app logs --app <application name>`
- To follow the logs run
  * `ibmcloud ce app logs -f --app <application name>`  
