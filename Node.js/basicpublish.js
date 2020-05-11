/**
 * Copyright 2019 IBM Corp.
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


// This is a demonstration showing the basic publish operations onto a MQ Topic
// Using the MQI Node.js interface

// This application is based on the samples
// https://github.com/ibm-messaging/mq-mqi-nodejs/blob/master/samples/amqsconn.js
// and
// https://github.com/ibm-messaging/mq-mqi-nodejs/blob/master/samples/amqspub.js
//
// Values for Queue Manager, Topic, Host, Port and Channel are
// passed in as envrionment variables.

const fs = require('fs');
// Import the MQ package
var mq = require('ibmmq');

// Load up missing envrionment variables from the env.json file
var env = require('../env.json');

var MQC = mq.MQC; // Want to refer to this export directly for simplicity

// Set up debug logging options
var debug_info = require('debug')('amqspub:info');
var debug_warn = require('debug')('amqspub:warn');

// Set up Constants
const CCDT = "MQCCDTURL";
const	FILEPREFIX = "file://";

// Load the MQ Endpoint details either from the envrionment or from the
// env.json file. The envrionment takes precedence. The json file allows for
// mulitple endpoints ala a cluster. A Connection string is built using
// HOST(PORT) values for all the specified endpoints.
var MQDetails = {};
['QMGR', 'TOPIC_NAME', 'HOST', 'PORT',
 'CHANNEL', 'KEY_REPOSITORY', 'CIPHER'].forEach(function(f) {
  MQDetails[f] = process.env[f] || env.MQ_ENDPOINTS[0][f]
});

var credentials = {
  USER: process.env.APP_USER || env.MQ_ENDPOINTS[0].APP_USER,
  PASSWORD: process.env.APP_PASSWORD || env.MQ_ENDPOINTS[0].APP_PASSWORD
}

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
function publishMessage(hObj) {

  var msgObject = {
    'Greeting': "Hello from Node at " + new Date()
  }
  var msg = JSON.stringify(msgObject);

  var mqmd = new mq.MQMD(); // Defaults are fine.
  var pmo = new mq.MQPMO();

  // Describe how the Publish (Put) should behave
  pmo.Options = MQC.MQPMO_NO_SYNCPOINT |
    MQC.MQPMO_NEW_MSG_ID |
    MQC.MQPMO_NEW_CORREL_ID;
  // Add in the flag that gives a warning if noone is
  // subscribed to this topic.
  pmo.Options |= MQC.MQPMO_WARN_IF_NO_SUBS_MATCHED;
  mq.Put(hObj, mqmd, pmo, msg, function(err) {
    if (err && 'object' === typeof err && err.mqrc &&
      MQC.MQRC_NO_SUBS_MATCHED == err.mqrc && err.mqrcstr) {
      debug_info('Publish unsuccessful because there are no subscribers', err.mqrcstr);
    } else if (err) {
      debug_warn('Error Detected in Put operation', err);
    } else {
      debug_info('MsgId: ', toHexString(mqmd.MsgId));
      debug_info("MQPUT for Publish successful");
    }
  });
}

// amqspub:warn Error Detected in Put operation { MQError: PUT: MQCC = MQCC_WARNING [1] MQRC = MQRC_NO_SUBS_MATCHED [2550]



// When we're done, close topics and connections
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

// The program really starts here.
// Connect to the queue manager. If that works, the callback function
// opens the topic, and then we can put a message.

debug_info('Running on ', process.platform);
debug_info('Starting up Application');

var cno = new mq.MQCNO();
// cno.Options = MQC.MQCNO_NONE;
// use MQCNO_CLIENT_BINDING to connect as client
cno.Options = MQC.MQCNO_CLIENT_BINDING;

// To add authentication, enable this block
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
  if (err) {
    debug_warn('Error Detected making Connection', err);
  } else {
    debug_info("MQCONN to %s successful ", MQDetails.QMGR);

    // Define what we want to open, and how we want to open it.
    //
    // For this sample, we use only the ObjectString, though it is possible
    // to use the ObjectName to refer to a topic Object (ie something
    // that shows up in the DISPLAY TOPIC list) and then that
    // object's TopicStr attribute is used as a prefix to the TopicString
    // value supplied here.
    // Remember that the combined TopicString attribute has to match what
    // the subscriber is using.
    var od = new mq.MQOD();
    od.ObjectString = MQDetails.TOPIC_NAME;
    od.ObjectType = MQC.MQOT_TOPIC;
    var openOptions = MQC.MQOO_OUTPUT;
    mq.Open(hConn, od, openOptions, function(err, hObj) {
      if (err) {
        debug_warn('Error Detected Opening MQ Connection', err);
      } else {
        debug_info("MQOPEN of %s successful", MQDetails.QUEUE_NAME);
        publishMessage(hObj);
      }
      cleanup(hConn, hObj);
    });
  }
});
