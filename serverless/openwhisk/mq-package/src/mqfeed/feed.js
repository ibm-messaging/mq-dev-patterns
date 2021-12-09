/**
 * Copyright 2021 IBM Corp.
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

const Memory = require('./lib/memory.js');
const MQRest = require('./lib/mqrestapi.js');
const MQParamBuilder = require('./lib/parambuilder.js');
const MQTriggers = require('./lib/triggers.js');

let restarted = true;
let iterationCount = 1;
let memory = null;
let mqrest = new MQRest();
let mqparam = new MQParamBuilder();
let triggers = new MQTriggers();


// Function to read the next message from the message queue.
// First check and build the REST Call parameters.
// If all is ok then invoke the REST call, and
// return the message id.
function checkQueue (params) {
  return new Promise((resolve, reject) => {
    mqparam.buildGetParams(params)
      .then((options) => {
        return mqrest.browseForMsg(options);
      }).then((data) => {
        console.log('Message is <%s>', data);
        resolve({
          "messageId": data
        });
      }).catch(function(err) {
        reject({
          "body": err
        });
      });
  });
}


// Function to check for a message on the message queue,
// and if found to fire the triggers, passing in the
// message id as input to the triggers.
function runQueueAndTriggerProcess (params) {
  let p = triggers.triggerCheck()
    .then(() => {
      return checkQueue(params);
    }).then ((msgData) => {
      console.log("Message Data found ", msgData);
      return triggers.runTriggers(msgData);
    }).then(() => {
      console.log("Triggers have run");
    }).catch((err) => {
      console.log("Error ", err);
      console.log("Aborting process");
    });

  return p;
}

// Function to keep a count of number of iterations that the
// feed has been in memory.
function setIterationCount() {
  console.log("In iteration count : ", iterationCount);
  iterationCount++;
  if (iterationCount > 998) {
    console.log("resetting iteration count");
    iterationCount = 1;
  }
}


// Function used to track when the
// feed has been swapped out of memory and usage of
// persistent data, over in-memory data.
// When the feed is new in memory, then the persistance storage
// is used to fetch registered trigger status.
function checkRestartIndicators(database, databasekey) {
  return new Promise((resolve, reject) => {
    if (restarted) {
      restarted = false;
      console.log("Feed has been restarted");
      if (database && databasekey) {
         memory.readPersistMemory()
         .then((data) => {
           console.log("have found data");
           console.log(data);
           // Not sure if need to perform deep copy!
           // but shallow copy seems to be working.
           if (data.mqtriggers) {
             triggers.setTriggers(data.mqtriggers);
           }
           setIterationCount();
           resolve({});
         }).catch((err) => {
           console.log("no data found");
           //console.log(err);
           setIterationCount();
           resolve({});
         });
      } else {
        resolve({});
      }
    } else {
      resolve({});
    }
  });
}

// Entry point for the feed.
// The feed is listening to OpenWhisk lifecyle events for triggers.
// Primarily `CREATE` for registering new triggers, and `DELETE` for
// removing old triggers.
// The `TRIGGER` event is a psuedo event registered as a default in the
// package mqfunctions.yml. This ensures that when the feed is triggered for
// anything other than a OpenWhisk lifecyle event, that it is seen as a
// TRIGGER event. 
function main (args) {
  let event = args.lifecycleEvent;
  let triggerName = args.triggerName;
  let authKey = args.authKey;

  let database = args.database;
  let databasekey = args.dbkey;

  console.log("Checking Restart indicators");
  console.log("restarted : ", restarted);
  console.log("iteration count: ", iterationCount);
  console.log("triggers: ", triggers.regTriggers());
  console.log("memory: ", memory);

  if (null === memory) {
    console.log("New memory object being initialized");
    memory = new Memory(database, databasekey);
  } else {
    console.log("Memory already initialized");
  }

  memory.check();

  console.log("Feed event triggered with args ", args);

  return new Promise((resolve, reject) => {
    checkRestartIndicators(database, databasekey)
    .then(() => {
      if ('CREATE' === event) {
        console.log('Create event for trigger ', triggerName);
        let newTrigger = {
          "name" : triggerName,
          "authKey" : authKey,
          "live" : true
        };
        triggers.addTrigger(triggerName, newTrigger);
        if (database && databasekey) {
          return memory.persistMemory(triggers.regTriggers());
        }
      } else if ('DELETE' === event) {
        console.log('Delete event for trigger ', triggerName);
        // Find the trigger in storage, and remove it if it is already there
        triggers.dropTrigger(triggerName);
        if (database && databasekey) {
           return memory.persistMemory(triggers.regTriggers());
        }
      } else if ('PAUSE' === event) {
        console.log('Pause event for trigger ', triggerName);
        // Find the trigger in storage, and set its live status to false.
        triggers.setTriggerStatus(triggerName, false);
        if (database && databasekey) {
          return memory.persistMemory(triggers.regTriggers());
        }
      } else if ('UNPAUSE' === event) {
        console.log('Unpause event for trigger ', triggerName);
        // Find the trigger in storage, and set its live status to true.
        triggers.setTriggerStatus(triggerName, true);
        if (database && databasekey) {
          return memory.persistMemory(triggers.regTriggers());
        }
      } else if ('UPDATE' === event) {
        console.log('Update event for trigger ', triggerName);
      } else if ('READ' === event) {
        console.log('Read event for trigger ', triggerName);
      } else if ('TRIGGER' === event) {
        console.log('Assuming interval invocation ', event);
        console.log('Starting Queue check and firing triggers process');
        // MQ Check to see if want to fire any triggers.
        return runQueueAndTriggerProcess(args);
      } else {
        console.log('Default processing triggers');
        // console.log('Taking no action');
        return runQueueAndTriggerProcess(args);
      }
      return Promise.resolve({});
    }).then(() => {
      console.log("Trigger lifecycleEvent completed");
      console.log("List of triggers is ", triggers.regTriggers());
      console.log('Returning from feed');
      resolve({});
    }).catch((err) => {
      console.log("Error Detected in processing lifecycleEvent");
      reject(err);
    });
  });
}


module.exports.main = main;
