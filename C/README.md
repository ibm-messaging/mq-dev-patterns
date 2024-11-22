# IBM MQ C samples
These samples use the C MQI to demonstrate basic messaging operations.

## Dependencies
* Install the IBM MQ client for your system, or unpack the Redistributable Client package if available.
  * The SDK component is needed in order to compile these programs.
* You also need a C compiler

## Introduction to the C samples

**sampleput.c** - Puts message to a queue

**sampleget.c** - Gets message from a queue

**samplesubscribe.c** - Subscribes to a topic string and gets publications/messages

**samplepublish.c** - Publishes messages to a topic string

**samplerequest.c** - Puts a message on a request queue and waits for a response

**sampleresponse.c**- Gets message from a request queue, does something with the message and puts it to the reply queue.

***common.c*** - Common functions, including managing the connection to the queue manager

***config.c*** - A simple parser for the configuration file

The connection to the queue manager demonstrates a variety of approaches. Choices are made based on the configuration.
These include
* Authentication
* Client or local connections
* TLS when using clients
* Application name used by Uniform Clusters

## Compiling the programs
On Linux and MacOS, you can use the Makefile by simply running _make_. The generated programs are created in the current
directory. If you have installed MQ into a non-default location, then you may need to change the directories named in
the Makefile.

On Windows, the `win_dev.bat` script sets the environment for the Visual Studio 2022 C compiler. And then the
`win_bld.bat` script compiles the programs. Default installation paths are assumed, so you might need to edit these
scripts for your system.

## Configuration
All of the programs read a JSON-formatted configuration file. The name of the file can be given as a command-line
parameter or by setting the JSON_CONFIG environment variable. If neither is set, the _env.json_ file from the parent
directory is used.

These samples do not use a real JSON parsing library, and are sensitive to the exact layout of the configuration file.
The default format, from the file in the root of this repository, should be referred to.

All configuration parameters can also be set through environment variables. See _config.h_ for the names of these
environment variables.

## Put/Get
The `sampleput` application places a short string message onto the queue.

The `sampleget` application reads all messages from the queue and displays the contents.

## Publish/Subscribe
Run these samples as a pair.

Start the `samplesubcribe` program in one window (or in the background) and immediately afterwards start the
`samplepublish` program in another window.

## Request/Response
Run these samples as a pair.

Start the `sampleresponse` program in one window (or in the background) and immediately afterwards start the
`samplerequest` program in another window.

