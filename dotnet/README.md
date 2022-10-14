# IBM MQ XMS samples
The XMS samples are based on the the existing samples shipped with IBM MQ Server and Client packages. The samples here have been tested with .NET 6.0 and Visual Studio Community 2022 v 17.3.6. Also it has been tested with Visual Studio for Mac 2022 v 17.3.7

## Download

[Windows MQ client v 9.1.2.0 download](https://www-945.ibm.com/support/fixcentral/swg/selectFixes?parent=ibm~WebSphere&product=ibm/WebSphere/WebSphere+MQ&release=9.1.2&platform=Windows+64-bit,+x86&function=fixId&fixids=9.1.2.0-IBM-MQC-Win64+&useReleaseAsTarget=true&includeSupersedes=0)

We have included '.sln', '.csproj', 'packages.config'. These were created with the Visual Studio Community 2019. We've also added the copy of the 'env.json' file from the top level directory to the '/dotnet' project directory, the files will be copied to '/bin/Debug/net6.0' and adjust the parameters to use your own queue manager.

## References from Visual Studio

[Newtonsoft JSON package](https://www.nuget.org/packages/Newtonsoft.Json/)

[IBM Message Service Client for .NET Standard (XMS .NET)](https://www.nuget.org/packages/IBMXMSDotnetClient/)

Reference it through Solution Explorer NuGet Package installer

## Rocket

We drive the running of all the samples through this one module that has the one main entry point in the project. Once you've built the project in Visual Studio, you can run the project .exe on the command line from the project directory bin/debug location or bin/release depending on how you built it.

For example:

`ibmmq_samples.exe put`

## Put / Get

Run

`ibmmq_samples.exe put`

In a separate terminal

`ibmmq_samples.exe get`


## Publish / Subscribe

In the first terminal;

You have to run the subscriber sample first so it creates a subscription and waits for a publication.

Run

`ibmmq_samples.exe sub`

In the second terminal;

Run the publisher sample

`ibmmq_samples.exe pub`


## Request / Response

In the first terminal;

Run the request sample

Run

`ibmmq_samples.exe request`

The request sample will put a message and wait for a response until it either gets a response or you ctrl+c interrupt it.

In the second terminal;

Run the response sample

Run

`ibmmq_samples.exe response`

The response sample will get a message from the queue, process it and put the response on the reply to queue and keep looking for more messages to respond to till you ctrl+c interrupt it.




## Run the samples with TLS

If you are using a .NET managed client, then the underlying .NET framework will carry out the TLS handshake with the MQ Server. Any exceptions generated in the .NET layer during the TLS handshake will surface as server or queue not found - [2059](https://www.ibm.com/support/knowledgecenter/en/SSFKSJ_9.1.0/com.ibm.mq.tro.doc/q041290_.htm).

To overcome this you need to import the client .p12 (or client side .kdb) certificate into Windows. Import it at either the user or the system level. Then in your app, set the key repository to either *USER or *SYSTEM depending on how you imported it.

For 'unmanaged' mode set KEY_REPOSITORY in your JSON file to the location of your key database / truststore

`"KEY_REPOSITORY": "./keys/clientkey",`

For 'managed' mode set KEY_REPOSITORY in your JSON file to

`"KEY_REPOSITORY": "*USER",`

or

`"KEY_REPOSITORY": "*SYSTEM",`

To find out how to import certificates on Windows, see [How to: View certificates with the MMC snap-in](https://docs.microsoft.com/en-us/dotnet/framework/wcf/feature-details/how-to-view-certificates-with-the-mmc-snap-in)
and
[Import and Export Certificate - Microsoft Windows](https://support.globalsign.com/customer/portal/articles/1217281-import-and-export-certificate---microsoft-windows).
