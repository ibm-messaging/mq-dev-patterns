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


// Import the MQ package
var mq = require('ibmmq');
// Import any other packages needed
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

// Load up missing envrionment variables from the env.json file
var env = require('../env.json');

var MQC = mq.MQC; // Want to refer to this export directly for simplicity

// Set up debug logging options
var debug_info = require('debug')('amqsrep:info');
var debug_warn = require('debug')('amqsrep:warn');

// Load the MQ Endpoint details either from the envrionment or from the
// env.json file. The envrionment takes precedence. The json file allows for
// mulitple endpoints ala a cluster, but for this sample only the first
// endpoint in the arryay is used.
var MQDetails = {};

['QMGR', 'QUEUE_NAME', 'HOST', 'PORT',
 'CHANNEL', 'KEY_REPOSITORY', 'CIPHER'].forEach(function(f) {
  MQDetails[f] = process.env[f] || env.MQ_ENDPOINTS[0][f]
});

var credentials = {
  USER: process.env.APP_USER || env.MQ_ENDPOINTS[0].APP_USER,
  PASSWORD: process.env.APP_PASSWORD || env.MQ_ENDPOINTS[0].APP_PASSWORD
}

// The default queue manager and queue to be used
//var qMgr = "QM1";
//var qName = "SYSTEM.DEFAULT.LOCAL.QUEUE";

// Global variables
var ok = true;


function toHexString(byteArray) {
  return byteArray.reduce((output, elem) =>
    (output + ('0' + elem.toString(16)).slice(-2)),
    '');
}

function endOfObject(buf) {
  let pos = 0;
  let indent = 0;
  buf.split('').forEach((c, i) => {
    switch (c) {
      case '{':
        indent++;
        break;
      case '}':
        indent--;
        if (0 === indent) {
          pos = i;
        }
        break;
    }
  });
  return pos;
}

// Define some functions that will be used from the main flow
function getMessages(hConn, hObj) {
  while (ok) {
    getMessage(hConn, hObj);
  }
}

// This function retrieves messages from the queue without waiting.
function getMessage(hConn, hObj) {
  var buf = Buffer.alloc(1024, 0);

  var mqmd = new mq.MQMD();
  var gmo = new mq.MQGMO();

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
      ok = false;
    } else if (mqmd.Format == "MQSTR") {
      var msgObject = null;

      // The Message from a Synchronouse GET is
      // a data buffer, which needs to be encoded
      // into a string, before the underlying
      // JSON object is extracted.
      // The stringify step is needed to truncate
      // the unitialised / empty part of the buffer.
      //var buffString = JSON.stringify(buf.toString('utf8'));
      var buffString = buf.toString('utf8');
      //var buffString = JSON.stringify(decoder.write(buf));
      var pos = endOfObject(buffString);
      debug_info('end is at ', pos);
      buffString = buffString.substring(0, pos + 1);
      debug_info('Truncated String is ', buffString);

      try {
        msgObject = JSON.parse(buffString);
        debug_info("Message Object found", msgObject);
        respondToRequest(hConn, hObj, msgObject, mqmd);
      } catch (err) {
        debug_warn('JSON Parsing error ', err);
        debug_info("message <%s>", decoder.write(buf));
      }
    } else {
      debug_info("binary message: " + buf);
    }
  });
}

function performCalc(n) {
  let sqRoot = Math.floor(Math.sqrt(n));
  let a = [];
  var i, j;

  i = 2;
  while (sqRoot <= n && i <= sqRoot) {
    if (0 === n % i) {
      a.push(i)
      n /= i;
    } else {
      j = i > 2 ? 2 : 1;
      i += j;
    }
  }
  a.push(n)

  return a;
}

function respondToRequest(hConn, hObj, msgObject, mqmdRequest) {
  debug_info('Preparing response to');
  debug_info('MsgID ', toHexString(mqmdRequest.MsgId));
  debug_info('CorrelId ', toHexString(mqmdRequest.CorrelId));
  debug_info('ReplyToQ ', mqmdRequest.ReplyToQ);
  debug_info('ReplyToQMgr ', mqmdRequest.ReplyToQMgr);
  debug_info('Request ', msgObject);
  debug_info(typeof msgObject, msgObject.value);

  var replyObject = {
    'Greeting': "Reply",
    'result': performCalc(msgObject.value)
  }
  var msg = JSON.stringify(replyObject);

  var od = new mq.MQOD();
  od.ObjectName = mqmdRequest.ReplyToQ;
  od.ObjectType = MQC.MQOT_Q;
  var openOptions = MQC.MQOO_OUTPUT;

  mq.Open(hConn, od, openOptions, function(err, hObjReply) {
    debug_info('Inside MQ Open for Reply Callback function');
    if (err) {
      debug_warn('Error Detected Opening MQ Connection for Reply', err);
    } else {
      debug_info("MQOPEN of %s successful", mqmdRequest.ReplyToQMgr);

      var mqmd = new mq.MQMD(); // Defaults are fine.
      var pmo = new mq.MQPMO();

      mqmd.CorrelId = mqmdRequest.CorrelId;
      mqmd.MsgId = mqmdRequest.MsgId;

      // Describe how the Put should behave
      pmo.Options = MQC.MQPMO_NO_SYNCPOINT;

      mq.Put(hObjReply, mqmd, pmo, msg, function(err) {
        if (err) {
          debug_warn('Error Detected in Put operation', err);
        } else {
          debug_info('MsgId: ', toHexString(mqmd.MsgId));
          debug_info("MQPUT successful");
        }
      });

    }
  });

}

// When we're done, close queues and connections
function cleanup(hConn, hObj) {
  mq.Close(hObj, 0, function(err) {
    if (err) {
      debug_warn('Error Closing connection', err);
    } else {
      debug_info("MQCLOSE successful");
    }
    mq.Disc(hConn, function(err) {
      if (err) {
        debug_warn('Error disconnecting', err);
      } else {
        debug_info("MQDISC successful");
      }
    });
  });
}

// The program really starts here.
// Connect to the queue manager. If that works, the callback function
// opens the queue, and then we can start to retrieve messages.

debug_info("Sample MQ GET application start");

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

// Do the connect, including a callback function
mq.Connx(MQDetails.QMGR, cno, function(err, hConn) {
  if (err) {
    debug_warn('Error Detected making Connection', err);
  } else {
    debug_info("MQCONN to %s successful ", MQDetails.QMGR);
    // Define what we want to open, and how we want to open it.
    var od = new mq.MQOD();
    od.ObjectName = MQDetails.QUEUE_NAME;
    od.ObjectType = MQC.MQOT_Q;
    var openOptions = MQC.MQOO_INPUT_AS_Q_DEF;
    mq.Open(hConn, od, openOptions, function(err, hObj) {
      if (err) {
        debug_warn('Error Detected Opening MQ Connection', err);
      } else {
        debug_info("MQOPEN of %s successful", MQDetails.QUEUE_NAME);
        // And loop getting messages until done.
        getMessages(hConn, hObj);
      }
      cleanup(hConn, hObj);
    });
  }
});
