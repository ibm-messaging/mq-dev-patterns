# mq-app-code-engine
The Code Engine sample apps are Node.js applications and have been tested with Node v12.16.3, and Code Engine buildpack.

## The Application
The application can be found in the folder [clientapp](/codeengine/clientapp/). The application structure is designed to run as a Code Engine buildpack app, but can be run locally.  

### server.js
This is the file that the Code Engine buildpack will run. It is largely Node.js HTTP app boilerplate, and pulls in `mqapp.js`

### mqapp.js
This file is largley Node.js Express boilerplate. Web and API routes are defined in `approutes.js`

### approutes.js
This file sets up routes for 3 webpages and 3 APIs. The routes uses  `mqclient.js` to make MQ calls.


/ (Home Page)
: Shows application version.

/mqput
: Shows a form that puts a number of messages onto a queue.

/mpget
: Shows a form that gets a number of messages from a queue.

/api/mqput
: API route that the mqput page uses to put messages onto a queue.

/api/mqgetby
: API route that the mqget page uses to get messages from a queue.

/api/mqgetbyid
: API route that is used to get a message with a specific message id.


## The Event Emitter
The Event Emitter can be found in the folder [eventemitter](/codeengine/eventemitter/).

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
This listens for a `mqevent`, when it invokes the registered endpoint.




## Code Engine Steps

- Create QueueManager
- Get
  - App Credentials
  - Connection Details
  - Public Certificate


- Create Code Engine Project
- Set up image repository
- Create Build - buidpack strategy
- Submit Build
- Add Logging
  - ibmcloud ce buildrun logs --name <build name>

- Create application
- ibmcloud ce project select --name <project name>
- ibmcloud ce app logs --app <application name>
