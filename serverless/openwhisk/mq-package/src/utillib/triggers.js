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

const openwhisk = require('openwhisk');


// This class is the trigger manager. It holds the registered
// triggers in-memory, and fires them when needed.
class MQTriggers {
  constructor() {
    this._regTriggers = {};
  }

  regTriggers() {
    return this._regTriggers;
  }

  triggerCheck () {
    return new Promise((resolve, reject) => {
      if (Object.keys(this._regTriggers).length > 0) {
        resolve();
      } else {
        reject("No registered triggers, no need to continue process");
      }
    });
  }

  runTriggers (msgData) {
    return new Promise((resolve, reject) => {
      console.log("Running trigger for ", msgData);
      let promises = [];
      for (var t in this._regTriggers) {
        // check if the property/key is defined in the object
        if (this._regTriggers.hasOwnProperty(t)) {
          let trigger = this._regTriggers[t]
          console.log('trigger ', trigger);
          // Here we can check if we want to fire the trigger based on MQ properties
          // ...
          // Need to do this for each as each may be in different package and
          // have a different API Key
          if (trigger.live) {
            console.log("Trigger is live, so invoking")
            let ow1 = openwhisk({ api_key: trigger.authKey });
            let p = ow1.triggers.invoke({
              name: trigger.name,
              params: msgData
            });
            promises.push(p);
          }
        } // if trigger
      } // forloop

      Promise.all(promises)
        .then(results => {
          console.log("Trigger invoked");
          console.log(results);
          resolve({'results' : results});
        }).catch(err => {
          console.log("Error invoking trigger");
          console.log(err);
          reject({'error' : err});
        });

      //reject("runTriggers not working yet!")
    });
  }

  setTriggerStatus(triggerName, status) {
    if (this._regTriggers.hasOwnProperty(triggerName)) {
      this._regTriggers[triggerName].live = status;
    }
  }

  setTriggers(mqtriggers) {
    this._regTriggers = mqtriggers;
  }

  addTrigger(triggerName, newTrigger) {
    this._regTriggers[triggerName] = newTrigger;
  }

  dropTrigger(triggerName) {
    if (this._regTriggers.hasOwnProperty(triggerName)) {
       delete this._regTriggers[triggerName];
    }
  }

}

module.exports = MQTriggers;
