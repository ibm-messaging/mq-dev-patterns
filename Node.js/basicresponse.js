/**
 * Copyright 2018, 2022 IBM Corp.
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

var MQC = mq.MQC; // Want to refer to this export directly for simplicity

// Set up debug logging options
var debug_info = require('debug')('amqsrep:info');
var debug_warn = require('debug')('amqsrep:warn');

// Set up Constants
const CCDT = "MQCCDTURL";
const FILEPREFIX = "file://";
const MSG_TRESHOLD = 5;

// Load the MQ Endpoint details either from the envrionment or from the
// env.json file. The envrionment takes precedence. The json file allows for
// mulitple endpoints ala a cluster, but for this sample only the first
// endpoint in the arryay is used.
var MQDetails = {};

['QMGR', 'QUEUE_NAME', 'BACKOUT_QUEUE', 'HOST', 'PORT',
  'CHANNEL', 'KEY_REPOSITORY', 'CIPHER'].forEach(function (f) {
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
function getMessages(hConn, hObj) {
  while (ok) {
    getMessage(hConn, hObj);
  }
  //This ok is set up every time that there is an error on getting the message
  // if there is an error
  if (ok == false) {
    return;
  }
}

function rollbackOrBackout(hConn, hObj, msgObject, mqmd) {
  // The application is going to end as a potential poison message scenario has been detected.
  // To prevent a recursive loop this application would need to compare the back out count for the message
  // with the back out threshold for the queue manager
  // see - https://stackoverflow.com/questions/64680808/ibm-mq-cmit-and-rollback-with-syncpoint
  debug_warn('A potential poison message scenario has been detected.');

  var counter = mqmd.BackoutCount;
  debug_info("------CURRENT BACKOUT COUNTER " + counter);

  if (counter >= MSG_TRESHOLD) {

    try {
      mqmd.ReplyToQ = MQDetails.BACKOUT_QUEUE;
      debug_info("Redirecting the message to the backout queue " + mqmd.ReplyToQ)
      respondToRequest(hConn, hObj, msgObject, mqmd, true);
      debug_info("Message redirected correctly")
    } catch (err) {
      ok = false
    }

  } else {
    mq.Back(hConn, function (err) {

      if (err) {
        debug_warn('Error on rollback', err);
        ok = false
      } else {
        debug_info('Rollback Successful');
      }

    });
  }
}

// This function retrieves messages from the queue without waiting.
function getMessage(hConn, hObj) {
  var buf = Buffer.alloc(1024, 0);

  var mqmd = new mq.MQMD();
  var gmo = new mq.MQGMO();

  gmo.Options = MQC.MQGMO_SYNCPOINT |
    MQC.MQGMO_CONVERT |
    MQC.MQGMO_FAIL_IF_QUIESCING;

  gmo.WaitInterval = 3 * 1000;
  var responseOk = true

  mq.GetSync(hObj, mqmd, gmo, buf, function (err, len) {

    if (err) {
      if (err.mqrc == MQC.MQRC_NO_MSG_AVAILABLE) {
        debug_info("no more messages");
        ok = false;
      } else {
        debug_warn('Error retrieving message', err);
        responseOk = false;
      }

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
      var pos = endOfObject(buffString);
      buffString = buffString.substring(0, pos + 1);

      try {
        msgObject = JSON.parse(buffString);
        debug_info("Message Object found", msgObject);
        respondToRequest(hConn, hObj, msgObject, mqmd);

      } catch (err) {
        responseOk = false
      }
    } else {
      debug_info("binary message: " + buf);
      ok = false
      return
    }
  });

  if (responseOk === false) {
    rollbackOrBackout(hConn, hObj, buf, mqmd);
  }

}



function respondToRequest(hConn, hObj, msgObject, mqmdRequest, isForBackout = false) {
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

  if (!isForBackout) {
    msgObject = JSON.stringify(replyObject);
    console.log("STRINGFYING...")
  }

  var od = new mq.MQOD();
  od.ObjectName = mqmdRequest.ReplyToQ;
  od.ObjectType = MQC.MQOT_Q;
  var openOptions = MQC.MQOO_OUTPUT;


  mq.OpenSync(hConn, od, openOptions, function (err, hObjReply) {


    if (err) {
      debug_warn('Error Detected Opening MQ Connection for Reply', err);
      throw new Error(err)
    } else {
      debug_info("MQOPEN of %s successful", mqmdRequest.ReplyToQMgr);


      var pmo = new mq.MQPMO();
      var mqmd;
      if (!isForBackout) {
        mqmd = new mq.MQMD(); // Defaults are fine.
        mqmd.CorrelId = mqmdRequest.CorrelId;
        mqmd.MsgId = mqmdRequest.MsgId;
      }
      else if (isForBackout === true) {
        mqmd = mqmdRequest;
      }


      // Describe how the Put should behave
      pmo.Options = MQC.MQPMO_SYNCPOINT;

      //  If any error is detected in the reply put operation, then we have not been able to handle
      // the original request received. That message needs to be rolled back onto the queue.
      // If there is no error, then both our read of the request and our send of the reply can be
      // committed. That will permanently take the request off the queue, and commit the reply
      // allowing it to be read by the requesting application.
      mq.PutSync(hObjReply, mqmd, pmo, msgObject, function (err) {
        if (err) {
          debug_warn('Error Detected in Put operation', err);
          throw new Error(err)
        } else {
          debug_info('MsgId: ', toHexString(mqmd.MsgId));
          debug_info("MQPUT successful");
          mq.Cmit(hConn, function (err) {
            if (err) {
              debug_warn('Error on commit', err);
            } else {
              debug_info('Commit Successful');
            }
          });
        }
      });
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

// When we're done, close queues and connections
function cleanup(hConn, hObj) {
  mq.Close(hObj, 0, function (err) {
    if (err) {
      debug_warn('Error Closing connection', err);
    } else {
      debug_info("MQCLOSE successful");
    }
    mq.Disc(hConn, function (err) {
      if (err) {
        debug_warn('Error disconnecting', err);
      } else {
        debug_info("MQDISC successful");
      }
    });
  });
}

function ccdtCheck() {
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

if (!ccdtCheck()) {
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

// Do the connect, including a callback function
mq.Connx(MQDetails.QMGR, cno, function (err, hConn) {
  if (err) {
    debug_warn('Error Detected making Connection', err);
  } else {
    debug_info("MQCONN to %s successful ", MQDetails.QMGR);
    // Define what we want to open, and how we want to open it.
    var od = new mq.MQOD();
    od.ObjectName = MQDetails.QUEUE_NAME;
    od.ObjectType = MQC.MQOT_Q;
    var openOptions = MQC.MQOO_INPUT_AS_Q_DEF;
    mq.Open(hConn, od, openOptions, function (err, hObj) {
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
