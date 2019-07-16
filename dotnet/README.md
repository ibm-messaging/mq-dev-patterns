# IBM MQ XMS samples
The XMS samples are based on the the existing samples shipped with IBM MQ Server and Client packages. The samples here have been tested with .NET Framework 4.6 and Visual Studio Community 2017 v 15.9.5. Updates have been tested with Visual Studio Community 2019 v 16.1.4 and .NET Framework 4.8.03761.

## Download

[Windows MQ client v 9.1.2.0 download](https://www-945.ibm.com/support/fixcentral/swg/selectFixes?parent=ibm~WebSphere&product=ibm/WebSphere/WebSphere+MQ&release=9.1.2&platform=Windows+64-bit,+x86&function=fixId&fixids=9.1.2.0-IBM-MQC-Win64+&useReleaseAsTarget=true&includeSupersedes=0)

Reference the IBM.XMS library through Visual Studio Solution References option, right click and browse to [MQ default install location](C:\Program Files\IBM\MQ\bin\IBM.XMS.dll).

We have included '.sln' and '.csproj' files. These were created with the Visual Studio Community 2019. You'll need to copy the 'env.json' file from the top level directory to '/bin/Debug' in your project directory and adjust to use your own queue manager.

## Reference from Visual Studio

[Newtonsoft JSON package](https://www.nuget.org/packages/Newtonsoft.Json/)

Reference it through Solution Explorer NuGet Package installer

## Rocket

We drive the running of all the samples through this one module that has the one main entry point in the project. Once you've built the project in Visual Studio, you can run the project .exe on the command line from the project directory bin/debug location or bin/release depending on how you built it.

For example:

`dotnet.exe put`

## Put / Get

Run

`dotnet.exe put`

In a separate terminal

`dotnet.exe get`


## Publish / Subscribe

In the first terminal;

You have to run the subscriber sample first so it creates a subscription and waits for a publication.

Run

`dotnet.exe sub`

In the second terminal;

Run the publisher sample

`dotnet.exe pub`


## Request / Response

In the first terminal;

Run the request sample

Run

`dotnet.exe request`

The request sample will put a message and wait for a response until it either gets a response or you ctrl+c interrupt it.

In the second terminal;

Run the response sample

Run

`dotnet.exe response`

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
