# IBM MQ C samples
These samples use the C MQI to demonstrate basic messaging operations.

## Dependencies
* Install the IBM MQ client for your system, or unpack the Redistributable Client package if available.
  * The SDK component is needed in order to compile these programs.
* You also need a C compiler
* And the 'make' build automation tool

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
In particular, each item is expected to be on a separate line of the file.
The default format, from the file in the root of this repository, should be referred to.

All configuration parameters can also be set through environment variables. See _config.h_ for the names of these
environment variables.

Setting the `DEBUG` environment variable to any value causes the active configuration to be printed.

## Running the programs
Apart from the optional command line parameter naming the configuration file, there are no
other parameters to any of the programs.

You might need to run `setmqenv` to create environment variables pointing at your MQ installation
libraries. 

And on MacOS, the `DYLD_LIBRARY_PATH` will usually need to be set to include the 
`/opt/mqm/lib64` directory. 

`export DYLD_LIBRARY_PATH=/opt/mqm/lib64`

If you are on Linux, you might need set the `LD_LIBRARY_PATH` to include the `/opt/mqm/lib64` directory. 

`export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/opt/mqm/lib64`

See [here](https://www.ibm.com/docs/en/ibm-mq/latest?topic=reference-setmqenv-set-mq-environment) for 
more information about `setmqenv`. 

### Put/Get
The `sampleput` application places a short string message onto the queue.

`./sampleput`

The `sampleget` application reads all messages from the queue and displays the contents.

`./sampleget`

### Publish/Subscribe
Run these samples as a pair.

Start the `samplesubcribe` program in one window (or in the background) and immediately afterwards start the
`samplepublish` program in another window.

`./samplesubscribe`

`./samplepublish`

### Request/Response
Run these samples as a pair.

Start the `sampleresponse` program in one window (or in the background) and immediately afterwards start the
`samplerequest` program in another window.

`./sampleresponse`

`./samplerequest`

### Running samples with JWT authentication

* Note: JWT authentication has been enabled for MacOS, Linux and AIX platforms.

To enable token-based authentication, ensure you have a configured token issuer and queue manager [JWT README](jwt-jwks-docs/README.md) and then edit the `JWT_ISSUER` block in the env.json file

```JSON
"JWT_ISSUER" : [{
    "JWT_TOKEN_ENDPOINT":"https://<KEYCLOAK_URL>/realms/master/protocol/openid-connect/token",
    "JWT_TOKEN_USERNAME":"app",
    "JWT_TOKEN_PWD":"passw0rd",
    "JWT_TOKEN_CLIENTID":"admin-cli",
    "JWT_KEY_REPOSITORY": "path/to/tokenIssuerKeystore"
  }]
```
For JWT authentication via JWKS, make sure `JWT_KEY_REPOSITORY` points to your token issuer's public certificate(keycloakPublic.pem) and your queue manager is configured to retrieve the JWKS.

If you would like to proceed with JWT authentication without JWKS validation, edit the endpoint to use the correct URL and leave `JWT_KEY_REPOSITORY` blank.

#### Dependencies for JWT authentication
* libcurl
* json-c
* GNU make (for AIX only)

[curl](https://curl.se/docs/install.html)
[json-c](https://github.com/json-c/json-c)

On MacOS, the `DYLD_LIBRARY_PATH` will need to be set to include the curl library directory.

`export DYLD_LIBRARY_PATH=/opt/homebrew/opt/curl/lib:/opt/mqm/lib64`

* Note: This command uses the default homebrew install path, if you installed curl/json-c via another method, edit the path as required.

To compile a sample with JWT enablement:

* Note: If you are on an AIX machine, use the GNU `make` instead of the standard `make` program. Otherwise directives such as `ifeq` are
not recognised. This version of `make` will often be installed in `/opt/freeware/bin`.

If you have samples that you have already compiled, make sure to get rid of these executable files by running:

`make clean`

The Makefile provides default curl and json-c libraries installation paths for Mac (Homebrew), Linux (standard system paths), and AIX (AIX Toolbox) systems. If your environment matches one of these, you can simply run:

`make JWT=1`

If your libraries are installed in different locations, override the defaults by specifying the include and library paths explicitly:

`make JWT=1 \
  CURL_INCLUDE=/path/to/curl/include \
  CURL_LIB=/path/to/curl/lib \
  JSONC_INCLUDE=/path/to/json-c/include \
  JSONC_LIB=/path/to/json-c/lib`

Then you can run the samples as normal.
