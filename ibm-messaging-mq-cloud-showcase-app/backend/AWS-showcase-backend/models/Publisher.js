/**
 * Copyright 2022, 2023 IBM Corp.
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

const { v4: uuidv4 } = require('uuid');

const MQClient = require("../msms/message-session-manager");

//Set Logging options
let debug_info = require('debug')('mqapp-publisher:info');
let debug_warn = require('debug')('mqapp-publisher:warn');

class Publisher {
    constructor(appId, topic) {
        this.mqclient = new MQClient();
        this.myID = uuidv4();
        this.appId = appId;
        this.topic = topic;
    }
    

    async publishMessages(topic, quantity, message) {
        debug_info(`Publisher ${this.myID} publishing ${quantity} messages to topic ${topic}`);
        if(topic !== this.topic) {
            await this.cleanUp();
            this.topic = topic;
        }
        return new Promise((resolve, reject) => {
            this.mqclient.pub(topic,quantity,message)
            .then((pubRes) => {
                debug_info(`Publisher ${this.myID} received response from pub ${pubRes}`);
                resolve(pubRes);
            })
            .catch((err) => {
                debug_warn(`Error ${err} thrown by publisher ${this.myID}`);
                reject(err);
            })
        });
        
    }

    cleanUp() {
        debug_info(`publisher ${this.myID} cleanUp`);
        return this.mqclient.performCleanUp();
    }

    getAppId() { return this.appId; }
}

module.exports = {Publisher};