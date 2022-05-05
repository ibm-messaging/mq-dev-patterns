/**
 * Copyright 2018 IBM Corp.
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

// Set up debug logging options
var debug_info = require('debug')('samplerep:info');
var debug_warn = require('debug')('samplerep:warn');

var MQBoilerPlate = require('./boilerplate');

debug_info('Starting up Application');
var mqBoilerPlate = new MQBoilerPlate();

function msgCB(md, buf) {
  debug_info('Message Received');
  if (md.Format == "MQSTR") {
    var msgObject = null;
    try {
      msgObject = JSON.parse(buf);
      debug_info("JSON Message Object found", msgObject);
      respondToRequest(msgObject, md);
    } catch (err) {
      debug_info("Not JSON message <%s>", decoder.write(buf));
    }
  } else {
    debug_info("binary message: " + buf);
  }
  // Keep listening
  return true;
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
  mqBoilerPlate.openMQReplyToConnection(mqmdRequest.ReplyToQ)
    .then(() => {
      debug_info('Reply To Queue is ready');
      return mqBoilerPlate.replyMessage(mqmdRequest.MsgId, mqmdRequest.CorrelId, msg);
    })
    .then(() => {
      debug_info('Reply Posted');
    })
    .catch((err) => {
      debug_warn('Error Processing response ', err);
    })

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

mqBoilerPlate.initialise('GET')
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
    debug_info('Still Waiting...');
    return mqBoilerPlate.checkForTermination();
  })
  .then(() => {
    debug_info('Normal Teardown');
    mqBoilerPlate.teardown();
  })
  .catch((err) => {
    debug_info('Error Teardown');
    mqBoilerPlate.teardown();
  })


debug_info('Application Completed');
