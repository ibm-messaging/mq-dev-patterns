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


// This is a demonstration showing the put operations onto a MQ Queue
// Using the MQI Node.js interface

// This application makes use of promises and libraries
// to factorise common boilerplate code.

// Import any other packages needed
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

// Set up debug logging options
var debug_info = require('debug')('samplesub:info');
var debug_warn = require('debug')('samplesub:warn');

var MQBoilerPlate = require('./boilerplate');

debug_info('Starting up Application');
var mqBoilerPlate = new MQBoilerPlate();

function msgCB(md, buf) {
  debug_info('Message Received');
  if (md.Format == "MQSTR") {
    let msgObject = null;
    try {
      msgObject = JSON.parse(buf);
      debug_info("JSON Message Object found", msgObject);
    } catch (err) {
      debug_info("Not JSON message <%s>", decoder.write(buf));
    }
  } else {
    debug_info("binary message: " + buf);
  }
  // Keep listening
  return true;
}

mqBoilerPlate.initialise('SUBSCRIBE')
  .then(() => {
    debug_info('MQ Connection is established');
    return Promise.resolve();
  })
  .then(() => {
    debug_info('Getting Messages');
    return mqBoilerPlate.getMessages(null, msgCB);
  })
  .then(() => {
    debug_info('Kick start the get callback');
    return mqBoilerPlate.startGetAsyncProcess();
  })  
  .then(() => {
    debug_info('Waiting for termination');
    return mqBoilerPlate.checkForTermination();
  })
  .then(() => {
    debug_info('Signal termination of the callback thread');
    return mqBoilerPlate.signalDone();
  })    
  .then(() => {
    mqBoilerPlate.teardown();
  })
  .catch((err) => {
    debug_warn(err);
    mqBoilerPlate.teardown();
  })


debug_info('Application Completed');
