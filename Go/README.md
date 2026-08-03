# IBM MQ Go samples
The Go samples are based on https://github.com/ibm-messaging/mq-golang/tree/master/samples and have been tested with Golang version 1.24.0.

You must first install the IBM MQ C client SDK and have a C compiler that can be used for *CGo* processing.

## MacOS

See [MacOS Toolkit](https://ibm.biz/mq-mac-toolkit)

* Add `/opt/mqm/bin` and `/opt/mqm/samp/bin` to the PATH by editing `/etc/paths`
* Also `export DYLD_LIBRARY_PATH=/opt/mqm/lib64`

## Windows and Linux

The latest MQ Redistributable client packages can be downloaded from [here](https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/redist).
* The Windows package is named `version`-IBM-MQC-Redist-Win64.zip
  * For simplicity, this file should be unpacked into _C:\Program Files\IBM\MQ_. The main MQI header file should then be
    at _C:\Program Files\IBM\MQ\Tools\C\Include\cmqc.h_
* The Linux package  is named `version`-IBM-MQC-Redist-LinuxX64.tar.gz
  * For simplicity, this file should be unpacked into _/opt/mqm_. The main MQI header file should then be at
    _/opt/mqm/inc/cmqc.h_

## Other platforms
The full MQ client packages can be downloaded from [FixCentral](https://www.ibm.com/support/fixcentral/swg/)

## Use of Go modules

This repository makes use of *modules*. Using modules means that the mq-golang/ibmmq library is automatically
downloaded when referenced by the go.mod file.

## To run the samples

From the `Go` folder `cd` to the `src` folder.
You can then compile the samples.

### Put / Get

```
go build basicput.go
./basicput
```

In a separate terminal, also `cd` to `src` folder:

```
go build basicget.go
./basicget
```

### Publish / Subscribe

Open two terminals and in each `cd` to `src` folder.

In the first terminal;
You have to run the subscriber sample first so it creates a subscription and waits for a publication.


```
go build basicsub.go
./basicsub
```


If you run the publisher before a subscription has been created on the topic, subscribers joining after the event will
not receive the publication (there are persistent options but we've not set these samples for that)

In the second terminal, run the publisher sample.

```
go build basicpub.go
./basicpub
```

### Request / Response

Open two terminals and in each `cd` to `src` folder.

In one of the terminals

```
go build basicrequest.go
./basicrequest
```

The request sample will put a message and wait for a response until it gets a response or you ctrl+c interrupt it, or a
timeout occurs.

```
go build basicresponse.go
./basicresponse
```

The response sample will get a message from the queue, process it and put the response on the reply-to queue. It
continues running for a short period to respond to any additional requests.

### Running samples with JWT authentication

To enable token-based authentication, ensure you have a configured token issuer and queue manager [JWT
README](jwt-jwks-docs/README.md) and then edit the `JWT_ISSUER` block in the env.json file

```JSON
"JWT_ISSUER" : [{
    "JWT_TOKEN_ENDPOINT":"https://<KEYCLOAK_URL>/realms/master/protocol/openid-connect/token",
    "JWT_TOKEN_USERNAME":"app",
    "JWT_TOKEN_PWD":"passw0rd",
    "JWT_TOKEN_CLIENTID":"admin-cli",
    "JWT_KEY_REPOSITORY": "path/to/tokenIssuerKeystore"
  }]
```
For JWT authentication via JWKS, make sure `JWT_KEY_REPOSITORY` points to your token issuer's public certificate and
your queue manager is configured to retrieve the JWKS

If you would like to proceed without JWKS, edit the endpoint to use the correct URL (beginning with http) and leave
`JWT_KEY_REPOSITORY` blank

## Compilation Errors
The most likely error during the compilation step is that the MQ header files and libraries are not installed in the
expected default directory:
* _/opt/mqm_ for Linux and MacOS
* _C:\Program Files\IBM\MQ\Tools\C\Include_ for Windows