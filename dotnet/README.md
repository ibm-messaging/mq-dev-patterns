# IBM MQ XMS samples
The XMS samples are based on the the existing samples shipped with IBM MQ Server and Client packages. The samples here have been tested with .NET 8.0 and .NET 9.0 and Visual Studio Code v  Also it has been tested with Visual Studio for windows 2022 v 17.13.6
 
We have included the .sln and .csproj files in the repository. These were created using Visual Studio 2022, and they are fully compatible with Visual Studio Code as well. We've also added the copy of the 'env.json' file from the top level directory to the '/dotnet' project directory, the files will be copied to '/bin/Debug/net8.0' or '/bin/Debug/net9.0'and adjust the parameters to use your own queue manager.

## References from Visual Studio

[Newtonsoft JSON package](https://www.nuget.org/packages/Newtonsoft.Json/)

[IBM Message Service Client for .NET Standard (XMS .NET)](https://www.nuget.org/packages/IBMXMSDotnetClient/)

Reference it through Solution Explorer NuGet Package installer
Note: If you're using Visual Studio Code, you can install the required packages through the terminal. Open the provided links and use the command listed under the .NET CLI tab. 

## Rocket

We drive the running of all the samples through this one module that has the one main entry point in the project. Once you've built the project in Visual Studio, you can run the project .exe on the command line from the project directory bin/debug location or bin/release depending on how you built it.

For example:

`./ibmmq_samples.exe put`

NOTE:  If you're running the application on Mac, make sure to remove the `.exe` extension from the command when executing the application. If you're using Visual Studio Code every time you build the application, make sure to run it using the `dotnet run` command. This ensures that the latest changes are compiled and reflected in the running application.

## Put / Get

Run

`./ibmmq_samples.exe put`

In a separate terminal

`./ibmmq_samples.exe get`


## Publish / Subscribe

In the first terminal;

You have to run the subscriber sample first so it creates a subscription and waits for a publication.

Run

`./ibmmq_samples.exe sub`

In the second terminal;

Run the publisher sample

`./ibmmq_samples.exe pub`


## Request / Response

In the first terminal;

Run the request sample

Run

`./ibmmq_samples.exe request`

The request sample will put a message and wait for a response until it either gets a response or you ctrl+c interrupt it.

In the second terminal;

Run the response sample

Run

`./ibmmq_samples.exe response`

The response sample will get a message from the queue, process it and put the response on the reply to queue and keep looking for more messages to respond to till you ctrl+c interrupt it.

## Run the samples with TLS
### For the Cloud Users:

Navigate to the "Application Credentials" tab of your cloud MQ service instance.

Click `add`, then create a user called "app". Click `Add and generate API key`, which will bring up your API token. Copy this and save it somewhere as you'll need it in the application you run to authenticate yourself to your MQ instance.

Navigate to the `Key store` tab and download the `public certificate` of the queue manager.

Add the certificate to your system's trusted store
- For Mac
```
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain <path-to-certificate-file>
```
This command adds the certificate at the system level.

- For Windows 
```
certutil –addstore -enterprise –f "Root" <pathtocertificatefile>
```
This command adds the certificate to the Shared Store, making it accessible at both the user and system levels.

### For the Non Cloud Users

If your Queue Manager is running in a container, follow [this tutorial](https://developer.ibm.com/tutorials/mq-secure-msgs-tls/) to learn how to generate and add the public and private parts of the certificates inside the container.
Note: There's no need to create a keystore on the client machine. Simply import the public certificate of the Queue Manager to the system's trusted store using the commands provided above. 

If your Queue Manger is in a local machine follow [Configuring mutual TLS authentication for a messaging application](https://developer.ibm.com/tutorials/configuring-mutual-tls-authentication-java-messaging-app/) this tutorial.

Import the certificate at either the user or the system level. Then in your app, set the key repository to either *USER or *SYSTEM depending on how you imported it.

Set KEY_REPOSITORY in your JSON file to

`"KEY_REPOSITORY": "*USER",`

or

`"KEY_REPOSITORY": "*SYSTEM",`


To find out how to import certificates on Windows, see [How to: View certificates with the MMC snap-in](https://docs.microsoft.com/en-us/dotnet/framework/wcf/feature-details/how-to-view-certificates-with-the-mmc-snap-in)
and
[Import and Export Certificate - Microsoft Windows](https://support.globalsign.com/customer/portal/articles/1217281-import-and-export-certificate---microsoft-windows).
