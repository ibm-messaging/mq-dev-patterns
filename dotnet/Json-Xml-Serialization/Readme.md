# IBM MQ .NET sample to Imitate the Serialization and Deserialization of Objects using JSON and XML Serializers

## Overview

Serialization is the process of converting an object into a format that can be stored (string, file, database) or transmitted (network). Deserialization is the reverse: converting that format back into an object.

`ReadObject` and `WriteObject` are methods provided in the IBM MQ .NET libraries (both in the base IBM.WMQ classes and the higher-level IBM.XMS API) that allow applications to serialize and deserialize .NET objects into MQ message bodies. These methods simplify the process of sending complex objects over MQ by automatically converting them to and from a binary format using the .NET `BinaryFormatter`. However, this approach relies on binary serialization, which has been removed by Microsoft due to multiple security risks, including the potential for remote code execution when deserializing untrusted data.

To align with Microsoft’s direction and ensure the long-term security and compatibility of IBM MQ .NET applications, the `ReadObject` and `WriteObject` methods are being removed starting with IBM MQ .NET 9.4.4 Continuous Delivery(CD) release. With the complete removal of `BinaryFormatter` in .NET 9, continuing to support these methods would pose security and platform compatibility issues. Applications should migrate to using explicit serialization approaches such as JSON or XML, using `TextMessage` or `BytesMessage`, which provide safer, more interoperable and future-proof alternatives for exchanging structured data across systems.

**IBM MQ Documentation : [Deprecated, stabilized and removed features in IBM MQ 9.4.4](https://www.ibm.com/docs/en/ibm-mq/9.4.x?topic=944-deprecated-stabilized-removed-features-in-mq)**

There are two main types of serializers that can be used as replacements for BinaryFormatter.

1. JSON Serialization using "System.Text.Json"
2. XML Serialization using "XmlSerializer"

### JSON Serialization (System.Text.Json)

- What it is : Converts objects into JSON (JavaScript Object Notation).
- Format : Human-readable, lightweight, widely used in APIs and web applications.
- Serialization : Converts an object into a JSON string, which can be saved into a .json file.
- Deserialization : Reads the JSON string and reconstructs the original object.
- Advantages :
  1. Fast and efficient
  2. Built into modern .NET versions (no extra packages required)
  3. Widely supported across platforms

- Best for : Web APIs, config files, data exchange with JavaScript or REST services.

### XML Serialization (System.Xml.Serialization)

- What it is : Converts objects into XML (Extensible Markup Language).
- Format : More verbose, but standardized and supported by many systems.
- Serialization : Converts an object into XML format, which can be saved into a .xml file.
- Deserialization : Reads the XML content and reconstructs the object.
- Advantages :
  1. Human-readable with strong schema support
  2. Good for interoperability with legacy systems
  3. Can be validated against XSD schemas

- Best for : Configurations, enterprise systems, or when working with systems that require XML.

### Sample Overview

The .NET sample is based on the existing samples shipped with IBM MQ Server and Client Packages. The sample here have been tested with .NET 8.0 and Visual Studio 2023 v 25.0.1706.3. Also it has been tested with Visual Studio for Mac 2023 v 25.0.1706.3.

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
