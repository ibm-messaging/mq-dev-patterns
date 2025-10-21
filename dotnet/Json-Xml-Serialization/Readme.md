# IBM MQ .NET sample to Imitate the Serialization and Deserialization of Objects using JSON and XML Serializers

The .NET sample are based on the existing samples shipped with IBM MQ Server and Client Packages. The sample here have been tested with .NET 8.0 and Visual Studio 2023 v 25.0.1706.3. Also it has been tested with Visual Studio for Mac 2023 v 25.0.1706.3.

We have included '.sln', '.csproj', 'packages.config'. These were created with the Visual Studio Community 2023. We've also added the copy of the 'env.json' file from the top level directory to the '/dotnet' project directory, the files will be copied to '/bin/Debug/net8.0' and adjust the parameters to use your own queue manager.
The User can also provide their external env.json by setting the environment variable ENV_FILE.

## References from Visual Studio

- **[IBM MQ .NET Client package](https://www.nuget.org/packages/IBMMQDotnetClient) : Used to make MQ API calls.**
- **[Newtonsoft JSON package](https://www.nuget.org/packages/Newtonsoft.Json/) : Used for Reading the Endpoints from the provided `env.json` file.**

Reference it through Solution Explorer NuGet Package installer

## JSON-Serialization and JSON-Deserialization

We use the JSON serializer and deserializer available in the `System.Text.Json` package.
Objects are serialized before performing a "Put" operation on the queue, and deserialized after performing a "Get" operation.

Both operations have been tested through the provided project.

To run the project, execute the `.exe` file from the command line.  
Navigate to the appropriate directory based on your build configuration:

- `bin\Debug\` (for Debug builds)
- `bin\Release\` (for Release builds)

For Example :

- `JSON_XML_Serialization.exe putjson` - Puts a JSON-serialized object onto an IBM MQ queue.
- `JSON_XML_Serialization.exe getjson` - Retrieves and deserializes a JSON-serialized message from an IBM MQ queue.

## XML-Serialization and XML-Deserialization

We use the XML serializer and deserializer available in the `System.Xml.Serialization` package.
Objects are serialized before performing a "Put" operation on the queue, and deserialized after performing a "Get" operation.

Both operations have been tested through the provided project.

To run the project, execute the `.exe` file from the command line.  
Navigate to the appropriate directory based on your build configuration:

- `bin\Debug\` (for Debug builds)
- `bin\Release\` (for Release builds)

For Example :

- `JSON_XML_Serialization.exe putxml` - Puts a XML-serialized object onto an IBM MQ queue.
- `JSON_XML_Serialization.exe getxml` - Retrieves and deserializes a XML-serialized message from an IBM MQ queue.
