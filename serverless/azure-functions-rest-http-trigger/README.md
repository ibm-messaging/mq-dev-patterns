# IBM MQ Serverless Sample for Azure Functions
These REST samples are written in Node.js and have been tested with a Azure Functions runtime of `Node.js v16`.

The application consists of a single Azure function exposed as an Azure Gateway API. 

## Testing locally 
These samples can be tested offline locally using [Azure Functions VSCode Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions). This extension has *Azure Account* and *Azure Resources* extensions as its dependency, which will get automatically installed. 

You will need to sign in to Azure even if you are testing this application locally. Log in to Azure via the *Azure Account* extension or through Azure Portal or by Azure CLI using `az login`.

## Building the application
The application is built by running the debugger on VSCode. Before running the debugger, we will need to configure MQ locally and initialise the *Function* on *Azure Functions* Extension.

**Local Configuration**

The application configuration for MQ server is in the `local.settings.json` file in the `Values` section. Set `HOSTNAME`, `QM_NAME` etc in for your MQ server.

**Initialise the *Function***

Click on the *Azure* icon on the left navigation bar on VSCode and expand "Workspace Local". Expand the folder called "Local Project" as well. Click on the message asking you to initialise the function and refresh the "Workspace".

Make sure you click on the folder `azure-functions-rest-http-trigger` and run the debugger. To do this, click on Run > Start Debugging on the top menu or click on F5. 

## Running the application locally
After starting the debugger, when prompted, allow the network connections. 

You should see an output similar to:
````
Host initialized (248ms)
Host state changed from Default to Initialized.
Host started (266ms)
Job host started
Worker 453f61d4-b41b-4e98-a5e9-37d9d1a48a0d connecting on 127.0.0.1:52390
File event source initialized.
Debug file watch initialized.
Established RPC channel. WorkerId: 453f61d4-b41b-4e98-a5e9-37d9d1a48a0d
Worker Process started. Received StartStream message
Diagnostic file watch initialized.
Hosting started
Host state changed from Initialized to Running.
Startup operation '5c55e57d-149f-45c7-b98d-2fa2f1428491' completed.

Functions:

        MQTriggerFunction:  http://localhost:7071/api/MQTriggerFunction

Received WorkerInitResponse. Worker process initialized
````

Navigate to the URL under `Functions:`. This will trigger the HTTP request to send a message to MQ. 

Navigate to the MQ console and observe the message sent. 

## Deploying the application

After ensuring that your function works correctly locally, you will need to create a *Function Application* using the *Azure Resources* VSCode extension. 

Navigate to VSCode *Azure* Extension and click the + sign next to "Resources". Click on the option "Create Function App in Azure..." and fill in the information accordingly. This will automatically create and deploy a *Function Application* along with the resources needed for it, which are *App Service plan*, *Application Insights*, and a *Storage account*. If needed, change these resources to fit your existing resources accordingly. 

Navigate to the "Workspace Local" part in *Azure* extension on VSCode and click the Cloud icon to deploy your *Azure Function* onto the *Function Application* you just created. 

**Remote Configuration**
The *Function* application configuration will be in the `host.json` file. You will need to do the configuration of the MQ server on [Azure Portal](https://portal.azure.com/#home).

Click on the *Configuration* tab on the left navigation bar in your *Function Application*. Under *Application Settings*, set `HOSTNAME`, `QM_NAME` etc in for your MQ server. Don't forget to save your settings. 
