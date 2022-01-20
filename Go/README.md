# IBM MQ Go samples
The Go samples are based on https://github.com/ibm-messaging/mq-golang/tree/master/samples and have been tested with Golang version 1.13.6.

Install/unzip IBM MQ client

## Mac

[IBM MQ MacOS toolkit for developers download](https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/mactoolkit/)

Add
`/opt/mqm/bin` and
`/opt/mqm/samp/bin`, to the PATH by editing `/etc/paths`

`export DYLD_LIBRARY_PATH=/opt/mqm/lib64`

## Windows

[Windows client v 9.1.5.0 download](https://www-945.ibm.com/support/fixcentral/swg/selectFixes?parent=ibm~WebSphere&product=ibm/WebSphere/WebSphere+MQ&release=9.1.5&platform=Windows+64-bit,+x86&function=fixId&fixids=9.1.5.0-IBM-MQC-Win64+&useReleaseAsTarget=true&includeSupersedes=0)


## Linux

[Linux Ubuntu client v 9.1.5.0 download](https://www-945.ibm.com/support/fixcentral/swg/selectFixes?parent=ibm~WebSphere&product=ibm/WebSphere/WebSphere+MQ&release=9.1.5&platform=Linux+64-bit,x86_64&function=fixId&fixids=9.1.5.0-IBM-MQC-UbuntuLinuxX64+&useReleaseAsTarget=true&includeSupersedes=0)

## Use of $GOPATH

This repository now makes use of *modules* and so the compiler no longer needs to have a `GOPATH` environment variable set. Using modules also means
that the mq-golang/ibmmq library is automatically downloaded when referenced by the go.mod file.

## To run the samples

From the `Go` folder `cd` to the `src` folder.

### Mac users - important - create symbolic link from MQ toolkit unzip location to /opt/mqm

The install script for the mq-golang library will look for what it needs in the lib64 folder of the Mac Toolkit;
but it will look for this in the /opt/mqm/lib64 folder.
We need to create a symbolic link:

`sudo ln -s  <unzip location>/IBM-MQ-Toolkit-Mac-x64-9.1.5.0 /opt/mqm`

For other platforms, the MQ client libraries are assumed to
have been installed in the default location.

You can then compile the samples.

### Put / Get
Compile first

`go build basicput.go`

and run
`./basicput`

In a separate terminal, also `cd` to `src` folder.

Compile first

`go build basicget.go`

and run
`./basicget`

### Publish / Subscribe

Open two terminals and in each `cd` to `src` folder.

In the first terminal;
You have to run the subscriber sample first so it creates a subscription and waits for a publication.

Compile first

`go build basicsub.go`

and run
`./basicsub`

If you run the publisher before a subscription has been created on the topic, subscribers joining after the event will not receive the publication (there are persistent options but we've not set these samples for that)

In the second terminal, run the publisher sample.

Compile first

`go build basicpub.go`

and run
`./basicpub`

### Request / Response

Open two terminals and in each `cd` to `src` folder.

In one of the terminals

Compile first

`go build basicrequest.go`

and run
`./basicrequest`

The request sample will put a message and wait for a response until it either gets a response or you ctrl+c interrupt it.

In the second terminal

Run the response sample

Compile first

`go build basicresponse.go`

and run
`./basicresponse`

The response sample will get a message from the queue, process it and put the response on the reply to queue and keep looking for more messages to respond to till you ctrl+c interrupt it.
