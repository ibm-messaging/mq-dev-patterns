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


// This is a demonstration showing a request operations onto a MQ Queue
// Using the MQI Node.js interface. The application creates a
// dynamic queue for the responder to reply to, posts the request
// and waits for a response.

// This application makes use of promises and libraries
// to factorise common boilerplate code.

// Set up debug logging options
var debug_info = require('debug')('samplereq:info');
var debug_warn = require('debug')('samplereq:warn');

var MQBoilerPlate = require('./boilerplate');
var mqBoilerPlate = new MQBoilerPlate();

function msgCB(md, buf) {
  debug_info('Message Received');
  if (md.Format == "MQSTR") {
    var msgObject = null;
    try {
      msgObject = JSON.parse(buf);
      debug_info("JSON Message Object found", msgObject);
    } catch (err) {
      debug_info("Not JSON message <%s>", decoder.write(buf));
    }
  } else {
    debug_info("binary message: " + buf);
  }
  // Stop listening
  return false;
}

debug_info('Starting up Application');

mqBoilerPlate.initialise('PUT')
  .then(() => {
    debug_info('MQ Connection is established');
    return Promise.resolve();
  })
  .then(() => {
    debug_info('Buidling Dynamic Queue Connection');
    return mqBoilerPlate.openMQDynamicConnection();
  })
  .then(() => {
    var msgObject = {
      'Greeting': "Hello from Node at " + new Date(),
      'value': Math.floor(Math.random() * 100)
    }
    var msg = JSON.stringify(msgObject);
    debug_info('Writing Message ', msg);
    return mqBoilerPlate.putRequest(msg);
  })
  .then((msgID) => {
    debug_info('Getting Response for ', msgID);
    return mqBoilerPlate.getMessagesDynamicQueue(msgID, msgCB);
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
