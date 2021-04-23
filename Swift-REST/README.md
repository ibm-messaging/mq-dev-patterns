# IBM MQ Swift REST samples
These samples have been tested on Xcode 12.4, Swift 5.3.2

## Building the samples
The easiest way to build the samples is to open `MQSwift.xcodeproj` in Xcode. If you want to build on the command line, then navigate to the `MQSwift` directory and run:

````
 swiftc -o mqtest *.swift
````

This will create the command line executable `mqtest`.

The built application `mqtest` looks for two command line arguments.

The first is the mode, this should be either `put` or `get`. If not provided it will default to `put`.

The second is the location of the environment json file. If this is not provided it will default to `./envrest.json`. This will work when running the application from the command line.

As Xcode applications are sandboxed, you will need the full directory location of the file when running from Xcode.  

## Sample envrest.json
We provide a default envrest.json file with the following settings

* **HOST** - Host name or IP address of your queue manager
* **PORT** - *HTTP* Listener port for your queue manager
* **QMGR** - Queue manager name
* **QUEUE_NAME** - Queue name
* **CSRFTOKEN** - MQ REST CSRF Token
* **APP_USER** - User name that application uses to connect to MQ
* **APP_PASSWORD** - Password that the application uses to connect to MQ

## Running the samples
To put a message onto the MQ Queue run:

````
./mqtest put ./envrest.json
````

or if using the default envrest.json location

````
./mqtest put
````

or

````
./mqtest
````


To get a message from the MQ Queue run:

````
./mqtest get ./envrest.json
````

or

````
./mqtest get
````
