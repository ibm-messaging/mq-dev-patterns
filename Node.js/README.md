# IBM MQ Node.js samples
The Node.js samples are based on https://github.com/ibm-messaging/mq-mqi-nodejs/tree/master/samples
and have been built and tested with Node.js v18.20.8 and v22.14.0


Install/unzip IBM MQ client

## Mac

[IBM MQ MacOS toolkit for developers download](https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/mactoolkit/)

Add
`/opt/mqm/bin` and
`/opt/mqm/samp/bin`, to the PATH by editing `/etc/paths`

`export DYLD_LIBRARY_PATH=/opt/mqm/lib64`

`export MQ_INSTALLATION_PATH=/opt/mqm`

## Windows

[Windows client v 9.1.1.0 download](https://www-945.ibm.com/support/fixcentral/swg/selectFixes?parent=ibm~WebSphere&product=ibm/WebSphere/WebSphere+MQ&release=9.1.1&platform=Windows+64-bit,+x86&function=fixId&fixids=9.1.1.0-IBM-MQC-Win64+&useReleaseAsTarget=true&includeSupersedes=0)


## Linux

[Linux Ubuntu client v 9.1.1.0 download](https://www-945.ibm.com/support/fixcentral/swg/selectFixes?parent=ibm~WebSphere&product=ibm/WebSphere/WebSphere+MQ&release=9.1.1&platform=Linux+64-bit,x86_64&function=fixId&fixids=9.1.1.0-IBM-MQC-UbuntuLinuxX64+&useReleaseAsTarget=true&includeSupersedes=0)

To run the examples cd to the Node.js directory and install the
prerequsites by running :

`npm install`

## Node.js Samples

The samples make use of promises and a shared boilerplate library to reduce duplication.

**sampleput.js** - Puts a message to a queue

**sampleget.js** - Gets messages from a queue

**samplesubscribe.js** - Subscribes to a topic string and gets publications/messages

**samplepublish.js** - Publishes messages to a topic string

**samplerequest.js** - Puts a message on a request queue and waits for a response

**sampleresponse.js** - Gets messages from a request queue, processes them, and puts replies to the reply queue

***boilerplate.js*** - Common class that manages the connection to the queue manager and contains generic consumer and producer code

The location and name of the env.json file defaults
to `../env.json`. This can be overriden by setting the environment option `EnvFile`. Before running the samples, export the path to the JSON file as shown below:

````
export EnvFile="../../envfile.json"
````


### Running samples with JWT authentication

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
For JWT authentication via JWKS, make sure `JWT_KEY_REPOSITORY` points to your token issuer's public certificate and your queue manager is configured to retrieve the JWKS

If you would like to proceed with JWT authentication without JWKS validation, edit the endpoint to use the correct URL (beginning with http) and leave `JWT_KEY_REPOSITORY` blank

## Put / Get
The put application places a json object onto the queue.

To run with logging:

On Mac and Linux:

`DEBUG=sample*:*,boiler:* node sampleput.js`

On Windows:
````
SET DEBUG=sample*:*,boiler:*
node sampleput.js
````

The get application reads json objects from the queue.

To run with logging:

On Mac and Linux:

`DEBUG=sample*:*,boiler:* node sampleget.js`

On Windows:
````
SET DEBUG=sample*:*,boiler:*
node sampleget.js
````

To set the application name, which is useful for problem determination, `SET` the environment variable `ApplName`. eg.

On Mac and Linux:
`DEBUG=sample*:*,boiler:* ApplName="sample put app" node sampleput.js`
and
`DEBUG=sample*:*,boiler:* ApplName="sample get app" node sampleget.js`


## Publish / Subscribe
The publish application publishes a json object onto a topic.

To run with logging:

On Mac and Linux:
`DEBUG=sample*:*,boiler:* node samplepublish.js`

On Windows:
````
SET DEBUG=sample*:*,boiler:*
node samplepublish.js
````

The subscribe application subscribes to a topic.

To run with logging:

On Mac and Linux:
`DEBUG=sample*:*,boiler:* node samplesubscribe.js`

On Windows:
````
SET DEBUG=sample*:*,boiler:*
node samplesubscribe.js
````

It is possible to set the application name by setting the environment value `ApplName`.

To create a durable subscription set the environment variable `DURABLE` to any value. eg.

`DEBUG=sample*:*,boiler:* DURABLE=1 ApplName="sample durable subscriber" node samplesubscribe.js`


## Request / Response
The request application creates a dynamic queue for a reply, places a json object onto a request queue, then waits for a response.

To run with logging, start the responder first, then the requester:

On Mac and Linux:

`DEBUG=sample*:*,boiler:* node sampleresponse.js`

and

`DEBUG=sample*:*,boiler:* node samplerequest.js`

On Windows:
````
SET DEBUG=sample*:*,boiler:*
node sampleresponse.js
````

and

````
SET DEBUG=sample*:*,boiler:*
node samplerequest.js
````

It is possible to set the application name by setting the environment value `ApplName`.

## Tests

Tests use [Mocha](https://mochajs.org/) and [Chai](https://www.chaijs.com/). Run them with:

```
npm test
```

**21 test cases across 17 suites** in 6 files. All tests connect to a live IBM MQ broker configured via `env.json`.

### Test file breakdown

#### `sampleput.test.js` — 5 suites · 5 tests

| Suite | Tests | Description |
|---|---|---|
| `MQBoilerPlate.toHexString` | 1 | Converts a `Uint8Array` to the correct lowercase hex string |
| `MQBoilerPlate#getConnection` | 1 | Returns `host(port)` pairs for every endpoint in `env.json` |
| `MQBoilerPlate.ccdtCheck` | 1 | Returns `true` only when `MQCCDTURL` env var is set and file exists |
| `MQBoilerPlate putMessage integration` | 1 | MQPUT increases queue depth by 1; asserted via `Inq` |
| `Multi-endpoint connection string` | 1 | All endpoints appear in the connection string |

#### `sampleget.test.js` — 4 suites · 4 tests

| Suite | Tests | Description |
|---|---|---|
| `MQBoilerPlate.ccdtCheck (get context)` | 1 | CCDT flag mirrors `MQCCDTURL` env var presence |
| `MQBoilerPlate buildMQDetails (via initialise)` | 1 | All `MQDetails` fields populated from `env.json` after `initialise('GET')` |
| `MQBoilerPlate GET lifecycle` | 1 | Connect → open queue → teardown resolves cleanly |
| `MQBoilerPlate getMessage (async callback)` | 1 | Put then get: async callback receives the message |

#### `samplepublish.test.js` — 2 suites · 2 tests

| Suite | Tests | Description |
|---|---|---|
| `MQBoilerPlate PUBLISH — no subscribers` | 1 | Publish tolerates `MQRC_NO_SUBS_MATCHED` without rejecting |
| `MQBoilerPlate PUBLISH + SUBSCRIBE — message delivery` | 1 | Subscriber receives message from publisher end-to-end |

#### `samplesubscribe.test.js` — 2 suites · 2 tests

| Suite | Tests | Description |
|---|---|---|
| `MQBoilerPlate SUBSCRIBE — non-durable receives published message` | 1 | Non-durable subscription delivers a published message |
| `MQBoilerPlate SUBSCRIBE — DURABLE environment variable` | 1 | `DURABLE=1` sets `isDurable=true` and subscription opens successfully |

#### `samplerequest.test.js` — 1 suite · 1 test

| Suite | Tests | Description |
|---|---|---|
| `samplerequest — end-to-end request / response round-trip` | 1 | Spawns `sampleresponse.js` as live responder; requester receives correlated reply with `result` field |

#### `sampleresponse.test.js` — 3 suites · 7 tests

| Suite | Tests | Description |
|---|---|---|
| `performCalc — unit tests` | 5 | Inputs 12, 7, 1, 60; `MSG_TRESHOLD` value |
| `sampleresponse — end-to-end request → reply (commit path)` | 1 | Spawns live responder; verifies reply received and dynamic queue depth returns to baseline |
| `sampleresponse — null-byte trimming regression` | 1 | Short payload (null-padded 1024-byte buffer) is parsed cleanly and a reply is returned |
