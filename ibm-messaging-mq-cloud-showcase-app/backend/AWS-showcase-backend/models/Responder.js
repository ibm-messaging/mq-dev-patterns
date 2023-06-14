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

 const { v4: uuidv4, stringify } = require('uuid');
 const MQClient = require("../msms/message-session-manager");

 //Set Logging options
let debug_info = require('debug')('mqapp-responder:info');
let debug_warn = require('debug')('mqapp-responder:warn');

class Responder {
    constructor(appId) {
        this.appId = appId;
        this.mqclient = new MQClient();        
        this.myID = uuidv4();
    }

    getMessageFromQueue(queueName) {
        return new Promise((resolve, reject) => {
            debug_info(`Responder ${this.myID} getting message from queue`);
            this.mqclient.get(queueName,1,null, 'DYNAMIC', this.appId)
            .then((messages) => {
                debug_warn(`The producer retrieved this message ${JSON.stringify(messages)}`);
                if(!messages[0].replyToMsg) {
                    debug_warn("This is not a reply to queue valid message");
                    resolve(null);
                }
                debug_info(`Responder ${this.myID} obtained message from queue`);
                resolve(messages);
            })
            .catch((err) => {
                debug_warn(`Responder ${this.myID} error obtaining message ${err}`);
                reject();
            })
        });
    }

    putToQueue(queueName, message, quantity) {
        let putRequest = {
            message : message,
            quantity : quantity,
            queueName : queueName
        };

        return new Promise((resolve, reject) => {
            debug_info(`Responder ${this.myID} replying to request`);
            this.mqclient.put(putRequest, 'DYNREP')
            .then(() => {
                debug_info(`Responder ${this.myID} replied successfully`);
                resolve("ok");
            })
            .catch((err) => {
                debug_warn(`Responder ${this.myID} error sending reply ${err}`);
                reject(err);
            })
        });
    }

    getAppId() {return this.appId;}
}

module.exports = {Responder};