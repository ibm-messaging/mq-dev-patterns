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


// This is a demonstration showing the put operations onto a MQ Queue
// Using the MQI Node.js interface

// This application makes use of promises and libraries
// to factorise common boilerplate code.

// Import any other packages needed
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');


//set up conts
const MSG_TRESHOLD = 5;

// Set up debug logging options
var debug_info = require('debug')('samplerep:info');
var debug_warn = require('debug')('samplerep:warn');

var MQBoilerPlate = require('./boilerplate');

debug_info('Starting up Application');
var mqBoilerPlate = new MQBoilerPlate();

async function msgCB(md, buf) {
  debug_info('Message Received');
  var ok = true
  if (md.Format == "MQSTR") {
    var msgObject = null;
    try {
      msgObject = JSON.parse(buf);
      debug_info("JSON Message Object found", msgObject);
      ok= await respondToRequest(msgObject, md);
     
    } catch (err) {
      debug_info("Not JSON message <%s>", decoder.write(buf));
      ok = false;      
    }
    handleSyncPoint(buf, md, ok);
  } else {
    debug_info("binary message: " + buf);
  }
  // Keep listening
  return true;
}

function handleSyncPoint(buf, md , ok) {
  
  if (!ok) {
    mqBoilerPlate.rollback(buf, md, poisoningMessageHandler,callbackOnRollback);
  } else {
    mqBoilerPlate.commit(callbackOnCommit);
  }

}

function poisoningMessageHandler(buf,md) {
  // The application is going to end as a potential poison message scenario has been detected.
  // To prevent a recursive loop this application would need to compare the back out count for the message
  // with the back out threshold for the queue manager
  // see - https://stackoverflow.com/questions/64680808/ibm-mq-cmit-and-rollback-with-syncpoint
  debug_warn ('A potential poison message scenario has been detected.');
  var rollback = false;
  var backoutCounter = md.BackoutCount;

  if(backoutCounter >= MSG_TRESHOLD) {
    
    debug_info("Redirecting to the backout queue");
    var BACKOUT_QUEUE = mqBoilerPlate.MQDetails.BACKOUT_QUEUE;

    sendToQueue(buf, md,BACKOUT_QUEUE).then(() => {
      debug_info('Reply Posted');
      mqBoilerPlate.commit(callbackOnCommit);
    })
    .catch((err) => {
      debug_warn('Error redirecting to the backout queue ');
    });
   
    rollback = false;
  } else {
    rollback = true;
  }

  return rollback;
}

function sendToQueue(buf, md, queue) {

  return mqBoilerPlate.openMQReplyToConnection(queue, 'DYNREP')
  .then(() => {
    debug_info('Reply To Queue is ready');
    return mqBoilerPlate.replyMessage(md.MsgId, md.CorrelId, buf)
  });
  
}

function callbackOnCommit(err) {
  if (err) {
    debug_warn('Error on commit', err);
  } else {
    debug_info('Commit Successful');
  }
}

function callbackOnRollback(err) {
  if (err) {
    debug_warn('Error on rollback', err);
  } else {
    debug_info('Rollback Successful');
  }
}


function respondToRequest(msgObject, mqmdRequest) {
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

  debug_info('Response will be ', msg);
  debug_info('Opening Reply To Connection');
  // Create ReplyToQ
  return sendToQueue(msg,mqmdRequest , mqmdRequest.ReplyToQ)
    .then(() => {
      debug_info('Reply Posted');
      return true
    })
    .catch((err) => {
      debug_warn('Error Processing response ', err);
      return false
    });

  // Post Response
}

function toHexString(byteArray) {
  return byteArray.reduce((output, elem) =>
    (output + ('0' + elem.toString(16)).slice(-2)),
    '');
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

mqBoilerPlate.initialise('GET', true)
  .then(() => {
    debug_info('MQ Connection is established');
    return Promise.resolve();
  })
  .then(() => {
    debug_info('Getting Messages');
    return mqBoilerPlate.getMessages(null, msgCB);
  })
  .then(() => {
    debug_info('Waiting for termination');
    return mqBoilerPlate.checkForTermination();
  })
  .then(() => {
    mqBoilerPlate.teardown();
  })
  .catch((err) => {
    mqBoilerPlate.teardown();
  })


debug_info('Application Completed');