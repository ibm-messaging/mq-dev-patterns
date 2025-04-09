# IBM MQ Serverless Sample for Azure Functions
These REST samples are written in Node.js and have been tested with a Azure Functions runtime of `Node.js v18 and v20`.

The application consists of two Azure functions exposed.

## Testing locally 
These samples can be tested offline locally using the [Azure Functions VSCode Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions). 

When testing these functions locally you do not need to sign into Azure or have an Azure account. 

## Building the application
The application is built by running the debugger on VSCode. Before running the debugger. 

**Local Configuration**
The application can be configured with upto 10 queue managers. 
The configuration for the queue managers is in the `local.settings.json` file in the `Values` section. Set 

- QM_NAME:0
- MQ_HOST:0
- MQ_PORT:0
- MQ_APPUSER:0
- MQ_PASSWORD:0

for the first queue manager,

- QM_NAME:1
- MQ_HOST:1
- MQ_PORT:1
- MQ_APPUSER:1
- MQ_PASSWORD:1

for the second queue manager, etc.

**Initialise the *Function***

Click on the *Azure* icon on the left navigation bar on VSCode and expand "Workspace Local". Expand the folder called "Local Project". 

Make sure you click on the folder `azure-functions-rest-http-trigger` and run the debugger. To do this, click on Run > Start Debugging on the top menu or click on F5. 

## Running the application locally
After starting the debugger, when prompted, allow the network connections. 

You should see an output similar to:

````
Functions:

        MQCreateMessageTrigger: [GET] http://localhost:7071/api/MQCreateMessageTrigger

        MQProcessMessageTrigger: [POST] http://localhost:7071/api/MQProcessMessageTrigger
````

Navigate to the CreateMessageTrigger URL under `Functions:`. This will trigger the HTTP request to send a message to MQ. 

Navigate to the MQ console and observe the message sent. 

The ProcessMessage function is compatible with the [MQ Observer](https://github.com/ibm-messaging/mq-code-engine-observer) as described in the [Write and run serverless MQ applications in AZure tutorial](https://developer.ibm.com/tutorials/mq-write-and-run-serverless-mq-applications-azure/)



## Deploying the application

After ensuring that your function works correctly locally, you will need to create a resource group and a *Function Application* on Azure. 

Navigate to the "Workspace Local" part in *Azure* extension on VSCode and click the Cloud icon to deploy your *Azure Function* into the *Function Application* you just created. 


**Remote Configuration**
The *Function* application configuration will be in the `host.json` file. You will need to do the configuration of the MQ server on [Azure Portal](https://portal.azure.com/#home).

Click on the *Settings* tab on the left navigation bar in your *Function Application*. Add settings for `QM_NAME:0`, `MQ_HOST:0` etc for each queue manager you want to service with these functions. 

Don't forget to save your settings. 
