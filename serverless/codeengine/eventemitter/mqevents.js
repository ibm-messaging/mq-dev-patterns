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

const EventEmitter = require('events');
const MQClient = require('./mqclient/mqclient');
let mqclient = new MQClient();

let debug_info = require('debug')('mqapp-mqevents:info');
let debug_warn = require('debug')('mqapp-mqevents:warn');

const INTERVAL = 8000;

class MQEvents extends EventEmitter {
    start() {
        setInterval(() => {
          debug_info("MQ Event Emitter Interval awakening");
          this.performMQQueueCheck()
          .then((msgData) => {
            debug_info('Found Message ', msgData);
            debug_info(`${new Date().toISOString()} >>>> pulse`);
            if (msgData) {
              this.emit('mqevent', msgData);
            }
            debug_info(`${new Date().toISOString()} <<<< pulse`);
          })
          .catch((err) => {
            debug_warn('Error detected in MQEvents EventEmitter ', err);
          })
        }, INTERVAL);
    }

    performMQQueueCheck() {
      return new Promise((resolve, reject) => {
        debug_info('Checking MQ for Messages');
        mqclient.browse()
        .then((msgData) => {
          resolve(msgData);
        })
        .catch((err) => {
          reject(err);
        });
      });
    }
}

module.exports = MQEvents;
