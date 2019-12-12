/**
 * Copyright 2018, 2019 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/


// This is a demonstration showing the basic put operations onto a MQ Queue
// Using the MQI Node.js interface

// This application is based on the samples
// https://github.com/ibm-messaging/mq-mqi-nodejs/blob/master/samples/amqsconn.js
// and
// https://github.com/ibm-messaging/mq-mqi-nodejs/blob/master/samples/amqsput.js
//
// Values for Queue Manager, Queue, Host, Port and Channel are
// passed in as envrionment variables.

const fs = require('fs');
// Import the MQ package
var mq = require('ibmmq');
// Import any other packages needed
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

// Load up missing envrionment variables from the env.json file
var env = require('../env.json');

// Want to refer to this export directly for simplicity
var MQC = mq.MQC;

// Set up debug logging options
var debug_info = require('debug')('amqsget:info');
var debug_warn = require('debug')('amqsget:warn');

// Set up Constants
const CCDT = "MQCCDTURL";
const	FILEPREFIX = "file://";


function buildMQDetails(MQDetails, credentials, index) {
  debug_info('Retrieving MQ Connection details for endpoint at %d', index);
  if (env.MQ_ENDPOINTS.length > index) {
    ['QMGR', 'QUEUE_NAME', 'HOST', 'PORT',
     'CHANNEL', 'KEY_REPOSITORY', 'CIPHER'].forEach((f) => {
      MQDetails[f] = process.env[f] || env.MQ_ENDPOINTS[index][f]
    });
    ['USER', 'PASSWORD'].forEach((f) => {
      let pField = 'APP_' + f;
      credentials[f] = process.env[pField] || env.MQ_ENDPOINTS[index][pField];
    });
  }
  return Promise.resolve();
}

function ccdtCheck () {
  if (CCDT in process.env) {
    let ccdtFile = process.env[CCDT].replace(FILEPREFIX, '');
    debug_info(ccdtFile);
    if (fs.existsSync(ccdtFile)) {
      debug_info("CCDT File found at ", ccdtFile);
      return true;
    }
  }
  return false;
}

function initialise(cno, MQDetails, credentials) {
  // For no authentication, disable this block
  if (credentials.USER) {
    let csp = new mq.MQCSP();
    csp.UserId = credentials.USER;
    csp.Password = credentials.PASSWORD;
    cno.SecurityParms = csp;
  }

  if (! ccdtCheck()) {
    debug_info('CCDT URL export is not set, will be using json envrionment client connections settings for %s', MQDetails['QMGR']);

    // And then fill in relevant fields for the MQCD
    let cd = new mq.MQCD();

    cd.ConnectionName = `${MQDetails.HOST}(${MQDetails.PORT})`;
    cd.ChannelName = MQDetails.CHANNEL;
    debug_info('Connection is ', cd.ConnectionName);

    if (MQDetails.KEY_REPOSITORY) {
      debug_info('Will be running in TLS Mode');

      cd.SSLCipherSpec = MQDetails.CIPHER;
      cd.SSLClientAuth = MQC.MQSCA_OPTIONAL;
    }

    // Make the MQCNO refer to the MQCD
    cno.ClientConn = cd;
  }

  if (MQDetails.KEY_REPOSITORY) {
    debug_info('SCO object to locate key repository for TLS');
    // *** For TLS ***
    let sco = new mq.MQSCO();

    sco.KeyRepository = MQDetails.KEY_REPOSITORY;
    // And make the CNO refer to the SSL Connection Options
    cno.SSLConfig = sco;
  }

  return Promise.resolve();
}

function connx(cno, MQDetails) {
  return new Promise(function resolver(resolve, reject){
    debug_info('Performing Connx');
    // Do the connect, including a callback function
    mq.Connx(MQDetails.QMGR, cno, function(err, hConn) {
      if (err) {
        debug_warn('Error Detected making Connection', err);
        reject();
      } else {
        debug_info("MQCONN to %s successful ", MQDetails.QMGR);
        resolve(hConn);
      }
    });
  });
}

function open(hConn, MQDetails) {
  return new Promise(function resolver(resolve, reject){
    debug_info('Opening MQ Connection');
    // Define what we want to open, and how we want to open it.
    let od = new mq.MQOD();
    od.ObjectName = MQDetails.QUEUE_NAME;
    od.ObjectType = MQC.MQOT_Q;
    let openOptions = MQC.MQOO_INPUT_AS_Q_DEF;
    mq.Open(hConn, od, openOptions, function(err, hObj) {
      if (err) {
        debug_warn('Error Detected Opening MQ Connection', err);
        reject();
      } else {
        resolve(hObj);
      }
    });
  });
}

// When we're done, close queues
function close(hObj, connCount) {
  return new Promise(function resolver(resolve, reject){
    if (1 == connCount) {
      mq.Close(hObj, 0, function(err) {
        if (err) {
          debug_warn('Error Closing connection', err);
        } else {
          debug_info("MQCLOSE successful");
        }
        // Always resolve to allow subsequent disconnects to work
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// When we're done, close queues and connections
function disconnect(hConn, connCount) {
  return new Promise(function resolver(resolve, reject){
    if (1 == connCount) {
      mq.Disc(hConn, function(err) {
        if (err) {
          debug_warn('Error disconnecting', err);
        } else {
          debug_info("MQDISC successful");
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// This function retrieves messages from the queue without waiting.
function getMessage(hObj) {
  return new Promise(function resolver(resolve, reject) {
    let buf = Buffer.alloc(1024);

    let mqmd = new mq.MQMD();
    let gmo = new mq.MQGMO();

    gmo.Options = MQC.MQGMO_NO_SYNCPOINT |
      MQC.MQGMO_NO_WAIT |
      MQC.MQGMO_CONVERT |
      MQC.MQGMO_FAIL_IF_QUIESCING;

      mq.GetSync(hObj, mqmd, gmo, buf, function(err, len) {
        if (err) {
          if (err.mqrc == MQC.MQRC_NO_MSG_AVAILABLE) {
            debug_info("no more messages");
          } else {
            debug_warn('Error retrieving message', err);
          }
          debug_info('Returning false from getMessage');
          resolve(false);
        } else if (mqmd.Format == "MQSTR") {
          // The Message from a Synchronouse GET is
          // a data buffer, which needs to be encoded
          // into a string, before the underlying
          // JSON object is extracted.
          // The stringify step is needed to truncate
          // the unitialised / empty part of the buffer.
          let buffString = JSON.stringify(buf.toString('utf8'));

          let msgObject = null;
          try {
            msgObject = JSON.parse(buffString);
            debug_info("Message Object found", msgObject);
          } catch (err) {
            debug_info("message <%s>", decoder.write(buf));
          }
        } else {
          debug_info("binary message: " + buf);
        }
        resolve(true);
      });

  });
}

function getMessages(hObj) {
  return new Promise(function resolver(resolve, reject) {
    debug_info('Retrieving next messages in getMessages');

    getMessage(hObj)
    .then((okToContinue) => {
      if (okToContinue) {
        return getMessages(hObj);
      } else {
        resolve();
      }
    })

    resolve();
  });
}

function processConnection(cno, MQDetails) {
  return new Promise(function resolver(resolve, reject){
    let hConn = null;
    let hObj = null;
    connx(cno, MQDetails)
      .then((newConnection) => {
        hConn = newConnection;
        return open(hConn, MQDetails);
      }).then((newObject) => {
        hObj = newObject;
        return getMessages(hObj);
      }).then(() => {
        return close(hObj, numOpenConnections);
      }).then(() => {
        return disconnect(hConn, numOpenConnections);
      }).then(() => {
        numOpenConnections--;
        resolve();
      }).catch(() => {
        debug_warn('Error processing queue');
        reject();
      })
  });
}


function cycleEndpoint(index) {
  return new Promise(function resolver(resolve, reject) {
    let MQDetails = {};
    let credentials = {};
    let endpointString = '';

    let cno = new mq.MQCNO();
    cno.Options = MQC.MQCNO_CLIENT_BINDING;

    buildMQDetails(MQDetails, credentials, index)
      .then(() => {
        endpointString = `${MQDetails.HOST}(${MQDetails.PORT})`;
        debug_info('Getting messages from ', endpointString);
        return initialise(cno, MQDetails, credentials);
      }).then(() => {
        return processConnection(cno, MQDetails);
      }).then(() => {
        debug_info('Endpoint processing complete for ', endpointString);
        resolve();
      }).catch(() => {
        debug_warn('Error during processing of endpoint %d ', index);
        reject();
      });

  });
}


// The program really starts here.
// Connect to the queue manager. If that works, the callback function
// opens the queue, and then we can start to retrieve messages.

debug_info("Sample MQ GET application start");

var promises = [];

// and Globals
var numOpenConnections = env.MQ_ENDPOINTS.length;

// Process each endpoint in turn
env.MQ_ENDPOINTS.forEach((point, index) => {
  debug_info('Processing endpoint at %d ', index);
  promises.push(cycleEndpoint(index));
});

// Wait for all the connections to the endpoints to report back
debug_info('Awaiting for endpoint processing to complete');
Promise.all(promises).then(() => {
  debug_info("Sample MQ GET application ending");
});
