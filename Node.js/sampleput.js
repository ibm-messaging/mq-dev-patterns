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

// Set up debug logging options
var debug_info = require('debug')('sampleput:info');
var debug_warn = require('debug')('sampleput:warn');

var MQBoilerPlate = require('./boilerplate');

debug_info('Starting up Application');

var mqBoilerPlate = new MQBoilerPlate();
mqBoilerPlate.initialise('PUT')
  .then(() => {
    debug_info('MQ Connection is established');
    return Promise.resolve();
  })
  .then(() => {
    var msgObject = {
      'Greeting': "Hello from Node at " + new Date()
    }
    var msg = JSON.stringify(msgObject);
    debug_info('Writing Message');
    return mqBoilerPlate.putMessage(msg);
  })
  .then(() => {
    mqBoilerPlate.teardown();
  })
  .catch((err) => {
    mqBoilerPlate.teardown();
  })

debug_info('Application Completed');
