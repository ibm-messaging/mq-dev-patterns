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
const mq = require('ibmmq');

// Load up missing envrionment variables from the env.json file
var env = require('../env.json');

var MQC = mq.MQC;

// Set up debug logging options
var debug_info = require('debug')('amqsput:info');
var debug_warn = require('debug')('amqsput:warn');

// Set up Constants
const CCDT = "MQCCDTURL";
const	FILEPREFIX = "file://";

// Load the MQ Endpoint details either from the envrionment or from the
// env.json file. The envrionment takes precedence.
// The json file allows for
// mulitple endpoints ala a cluster. The connection string is built
// using the host(port) values for all the endpoints.
// For all the other fields only the first
// endpoint in the arryay is used.
var MQDetails = {};

['QMGR', 'QUEUE_NAME', 'HOST', 'PORT',
 'CHANNEL', 'KEY_REPOSITORY', 'CIPHER'].forEach(function(f) {
  MQDetails[f] = process.env[f] || env.MQ_ENDPOINTS[0][f]
});

var credentials = {
  USER: process.env.APP_USER || env.MQ_ENDPOINTS[0].APP_USER,
  PASSWORD: process.env.APP_PASSWORD || env.MQ_ENDPOINTS[0].APP_PASSWORD
};

function toHexString(byteArray) {
  return byteArray.reduce((output, elem) =>
    (output + ('0' + elem.toString(16)).slice(-2)),
    '');
}

function getConnection() {
  let points = [];
  env.MQ_ENDPOINTS.forEach((p) => {
    if (p['HOST'] && p['PORT']) {
      points.push(`${p.HOST}(${p.PORT})`)
    }
  });
  return points.join(',');
}

// Define some functions that will be used from the main flow
function putMessage(hObj) {

  // var msg = "Hello from Node at " + new Date();
  var msgObject = {
    'Greeting': "Hello from Node at " + new Date()
  }
  var msg = JSON.stringify(msgObject);

  var mqmd = new mq.MQMD(); // Defaults are fine.
  var pmo = new mq.MQPMO();

  // Describe how the Put should behave
  pmo.Options = MQC.MQPMO_NO_SYNCPOINT |
    MQC.MQPMO_NEW_MSG_ID |
    MQC.MQPMO_NEW_CORREL_ID;

  mqmd.Persistence = MQC.MQPER_PERSISTENT;

  mq.Put(hObj, mqmd, pmo, msg, function(err) {
    if (err) {
      debug_warn('Error Detected in Put operation', err);
    } else {
      debug_info('MsgId: ', toHexString(mqmd.MsgId));
      debug_info("MQPUT successful");
    }
  });
}

// When we're done, close queues and connections
function cleanup(hConn, hObj) {
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

if (! ccdtCheck()) {
  debug_info('CCDT URL export is not set, will be using json envrionment client connections settings');

  // And then fill in relevant fields for the MQCD
  var cd = new mq.MQCD();

  cd.ChannelName = MQDetails.CHANNEL;
  cd.ConnectionName = getConnection();
  debug_info('Connections string is ', cd.ConnectionName);

  if (MQDetails.KEY_REPOSITORY) {
    debug_info('Will be running in TLS Mode');

    cd.SSLCipherSpec = MQDetails.CIPHER;
    cd.SSLClientAuth = MQC.MQSCA_OPTIONAL;
  }

  // Make the MQCNO refer to the MQCD
  cno.ClientConn = cd;
}

// The location of the KeyRepository is not specified in the CCDT, so regardless
// of whether a CCDT is being used, need to specify the KeyRepository location
// if it has been provided in the environment json settings.
if (MQDetails.KEY_REPOSITORY) {
  debug_info('Key Repository has been specified');
  // *** For TLS ***
  var sco = new mq.MQSCO();

  sco.KeyRepository = MQDetails.KEY_REPOSITORY;
  // And make the CNO refer to the SSL Connection Options
  cno.SSLConfig = sco;
}


debug_info('Attempting Connection to MQ Server');
mq.Connx(MQDetails.QMGR, cno, function(err, hConn) {
  debug_info('Inside Connection Callback function');

  if (err) {
    debug_warn('Error Detected making Connection', err);
  } else {
    debug_info("MQCONN to %s successful ", MQDetails.QMGR);
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
        putMessage(hObj);
      }
      cleanup(hConn, hObj);
    });

  }

});

debug_info('Application Start Completed');
