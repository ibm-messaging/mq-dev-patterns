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


// This is a demonstration showing a request operations onto a MQ Queue
// Using the MQI Node.js interface. The application creates a
// dynamic queue for the responder to reply to, posts the request
// and waits for a response.
//
// This application is based on the samples
// https://github.com/ibm-messaging/mq-mqi-nodejs/blob/master/samples/amqsconn.js
// https://github.com/ibm-messaging/mq-mqi-nodejs/blob/master/samples/amqsput.js
// and
// https://github.com/ibm-messaging/mq-mqi-nodejs/blob/master/samples/amqsget.js
//
// Values for Queue Manager, Queue, Host, Port and Channel are
// passed in as envrionment variables.

// Import the MQ package
const mq = require('ibmmq');

var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

// Load up missing envrionment variables from the .env settings file.
require('dotenv').load();

var MQC = mq.MQC;
var waitInterval = 5;

// Set up debug logging options
var debug_info = require('debug')('amqsreq:info');
var debug_warn = require('debug')('amqsreq:warn');


var MQDetails = {
  QMGR: process.env.QMGR,
  QUEUE_NAME: process.env.QUEUE_NAME,
  MODEL_QUEUE_NAME: process.env.MODEL_QUEUE_NAME,
  DYNAMIC_QUEUE_PREFIX: process.env.DYNAMIC_QUEUE_PREFIX,
  HOST: process.env.HOST,
  PORT: process.env.PORT,
  CHANNEL: process.env.CHANNEL,
  KEY_REPOSITORY: process.env.KEY_REPOSITORY,
  CIPHER: process.env.CIPHER
}

var credentials = {
  USER: process.env.APP_USER,
  PASSWORD: process.env.APP_PASSWORD
}

// Global variables
var ok = true;

function toHexString(byteArray) {
  return byteArray.reduce((output, elem) =>
    (output + ('0' + elem.toString(16)).slice(-2)),
    '');
}

function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

// Define some functions that will be used from the main flow
function putMessage(hObj, hObjDynamic, cb) {

  // var msg = "Hello from Node at " + new Date();
  var msgObject = {
    'Greeting': "Hello from Node at " + new Date(),
    'value': Math.floor(Math.random() * 100)
  }
  var msg = JSON.stringify(msgObject);

  var mqmd = new mq.MQMD(); // Defaults are fine.
  mqmd.ReplyToQ = hObjDynamic._name;
  mqmd.MsgType = MQC.MQMT_REQUEST;

  var pmo = new mq.MQPMO();

  // Describe how the Put should behave
  pmo.Options = MQC.MQPMO_NO_SYNCPOINT |
    MQC.MQPMO_NEW_MSG_ID |
    MQC.MQPMO_NEW_CORREL_ID;

  mq.Put(hObj, mqmd, pmo, msg, function(err) {
    if (err) {
      debug_warn('Error Detected in Put operation', err);
      cb(err, null);
    } else {
      var msgId = toHexString(mqmd.MsgId);
      debug_info('MsgId: ', msgId);
      debug_info("MQPUT successful");
      cb(null, msgId);
    }
  });
}

function awaitResponse(hObjDynamic, msgId, cb) {
  debug_info('Setting up timer');
  setTimeout(getResponse, waitInterval * 1000, hObjDynamic, msgId, cb);
  //getResponse(hObjDynamic, msgId);
}

function getResponse(hObjDynamic, msgId, cb) {
  debug_info("Waiting for response to request for msgId ", msgId);
  var buf = Buffer.alloc(1024);

  var mqmd = new mq.MQMD();
  var gmo = new mq.MQGMO();

  gmo.Options = MQC.MQGMO_NO_SYNCPOINT |
    MQC.MQGMO_NO_WAIT |
    MQC.MQGMO_CONVERT |
    MQC.MQGMO_FAIL_IF_QUIESCING;

  gmo.MatchOptions = MQC.MQMO_MATCH_MSG_ID;
  mqmd.MsgId = hexToBytes(msgId);

  // gmo.MatchOptions = MQC.MQMO_MATCH_CORREL_ID
  // mqmd.CorrelId = hexToBytes(msgId);

  mq.GetSync(hObjDynamic, mqmd, gmo, buf, function(err, len) {
    if (err) {
      if (err.mqrc == MQC.MQRC_NO_MSG_AVAILABLE) {
        debug_info("no more messages");
        if (ok) {
          awaitResponse(hObjDynamic, msgId, cb);
        }
      } else {
        debug_warn('Error retrieving message', err);
        cb(err, null);
        ok = false;
      }
    } else if (mqmd.Format == "MQSTR") {
      var msgObject = null;
      try {
        msgObject = JSON.parse(buf);
        debug_info("Message Object found", msgObject);
        cb(msgObject, null);
      } catch (err) {
        debug_info("message <%s>", decoder.write(buf));
        cb(err, null);
      }
    } else {
      debug_info("binary message: " + buf);
      cb(buf, null);
    }
  });
}

// When we're done, close queues and connections
function cleanup(hConn, hObj, hObjDynamic) {
  mq.Close(hObjDynamic, 0, function(err) {
    if (err) {
      debug_warn('Error Detected in Close operation of Dynamic queue', err);
    } else {
      debug_info("MQCLOSE successful of dynamic queue");
    }
    mq.Close(hObj, 0, function(err) {
      if (err) {
        debug_warn('Error Detected in Close operation', err);
      } else {
        debug_info("MQCLOSE successful");
      }
      mq.Disc(hConn, function(err) {
        if (err) {
          debug_warn('Error Detected in Disconnect operation', err);
        } else {
          debug_info("MQDISC successful");
        }
      });
    });
  });
}

debug_info('Running on ', process.platform);
debug_info('Starting up Application');

var cno = new mq.MQCNO();
// use MQCNO_CLIENT_BINDING to connect as client
// cno.Options = MQC.MQCNO_NONE;
cno.Options = MQC.MQCNO_CLIENT_BINDING;

// For no authentication, disable this block
if (credentials.USER) {
  var csp = new mq.MQCSP();
  csp.UserId = credentials.USER;
  csp.Password = credentials.PASSWORD;
  cno.SecurityParms = csp;
}

// And then fill in relevant fields for the MQCD
var cd = new mq.MQCD();
cd.ConnectionName = `${MQDetails.HOST}(${MQDetails.PORT})`;
cd.ChannelName = MQDetails.CHANNEL;

if (MQDetails.KEY_REPOSITORY) {
  debug_info('Will be running in TLS Mode');
  // *** For TLS ***
  var sco = new mq.MQSCO();

  cd.SSLCipherSpec = MQDetails.CIPHER;
  cd.SSLClientAuth = MQC.MQSCA_OPTIONAL;

  sco.KeyRepository = MQDetails.KEY_REPOSITORY;
  // And make the CNO refer to the SSL Connection Options
  cno.SSLConfig = sco;
}

// Make the MQCNO refer to the MQCD
cno.ClientConn = cd;

debug_info('Attempting Connection to MQ Server');
mq.Connx(MQDetails.QMGR, cno, function(err, hConn) {
  debug_info('Inside Connection Callback function');

  if (err) {
    debug_warn('Error Detected making Connection', err);
  } else {
    debug_info("MQCONN to %s successful ", MQDetails.QMGR);
    // Open up the Dynamic Response queue
    var odDynamic = new mq.MQOD();
    odDynamic.ObjectName = MQDetails.MODEL_QUEUE_NAME;
    odDynamic.DynamicQName = MQDetails.DYNAMIC_QUEUE_PREFIX;

    var openDynamicOptions = MQC.MQOO_INPUT_EXCLUSIVE;
    //var openDynamicOptions = null;

    mq.Open(hConn, odDynamic, openDynamicOptions, function(err, hObjDynamic) {
      debug_info('Inside MQ Open Dynamic Queue Callback function');
      if (err) {
        debug_warn('Error Detected Opening MQ Connection', err);
      } else {
        debug_info("MQOPEN of Dynamic Queue %s successful", hObjDynamic._name);
        debug_info(hObjDynamic);

        // Define what we want to open, and how we want to open it.
        var od = new mq.MQOD();
        od.ObjectName = MQDetails.QUEUE_NAME;
        od.ObjectType = MQC.MQOT_Q;

        var openOptions = MQC.MQOO_OUTPUT;

        mq.Open(hConn, od, openOptions, function(err, hObj) {
          debug_info('Inside MQ Open Callback function');
          if (err) {
            debug_warn('Error Detected Opening MQ Connection', err);
          } else {
            debug_info("MQOPEN of %s successful", MQDetails.QUEUE_NAME);
            putMessage(hObj, hObjDynamic, (err, msgId) => {
              if (msgId) {
                awaitResponse(hObjDynamic, msgId, (err, msg) => {
                  cleanup(hConn, hObj, hObjDynamic);
                });
              }
            });
          }
        });
      }
    });

  }

});

debug_info('Application Start Completed');
