# IBM MQ .NET samples for AMQP

The AMQP samples are based on the the existing samples shipped with IBM MQ Server and Client packages. The samples here have been tested with .NET 6.0 and Visual Studio Community 2023 v 25.0.1706.3. Also it has been tested with Visual Studio for Mac 2023 v 25.0.1706.3.

We have included '.sln', '.csproj', 'packages.config'. These were created with the Visual Studio Community 2023. We've also added the copy of the 'env.json' file from the top level directory to the '/dotnet' project directory, the files will be copied to '/bin/Debug/net6.0' and adjust the parameters to use your own queue manager.
The User can also provide their external env.json by setting the environment variable ENV_FILE.

## References from Visual Studio

[Newtonsoft JSON package](https://www.nuget.org/packages/Newtonsoft.Json/)

[AMQP 1.0 client module for .NET](https://github.com/Azure/amqpnetlite)

Reference it through Solution Explorer NuGet Package installer

## AMQPSamples

We drive the running of all the samples through this one module that has the one main entry point in the project. Once you've built the project in Visual Studio, you can run the project .exe on the command line from the project directory bin/debug location or bin/release depending on how you built it.

For example:

`ibmmq_amqp_samples.exe put`

## Put / Get

Run

`ibmmq_amqp_samples.exe put`

In a separate terminal

`ibmmq_amqp_samples.exe get`

## Publish / Subscribe

In the first terminal;

You have to run the subscriber sample first so it creates a subscription and waits for a publication.

Run

`ibmmq_amqp_samples.exe sub`

In the second terminal;

Run the publisher sample

`ibmmq_amqp_samples.exe pub`
