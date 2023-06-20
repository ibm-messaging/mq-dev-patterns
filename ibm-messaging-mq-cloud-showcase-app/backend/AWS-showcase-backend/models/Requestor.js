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
const {DynQueue} = require('./DynamicQueue');
const MQClient = require("../msms/message-session-manager");

 //Set Logging options
let debug_info = require('debug')('mqapp-requestor:info');
let debug_warn = require('debug')('mqapp-requestor:warn');

class Requestor {
    constructor(appId, sessionID) {
        this.appId = appId;
        this.mqclient = new MQClient();
        this.sessionID = sessionID;
        this.openDynQueues = [];
        this.myID = uuidv4();
    }

    getMessageFromQueue(dynQueueName) {                
        return new Promise ((resolve, reject) => {
            try {
                debug_info(`requester ${this.myID} getting message from queue`);
                let dynQueue = this.openDynQueues.find( q => q.dynQueueName === dynQueueName);                
                let message = dynQueue.lastMessages; 
                
                if (null !== message && Array.isArray(message) && message.length > 0) {
                    resolve(message[0].pop());
                } else {
                    resolve(null);
                }             
               
            } catch(err) {
                debug_warn(`requester ${this.myID} error getting message from queue ${err}`);
                reject(err);
            }
        });                               
    }

    putToQueue(queueName, message, quantity) {
        let putRequest = {
            message : message,
            quantity : quantity,
            queueName : queueName
        };

        return new Promise((resolve, reject) => {
            this.mqclient.put(putRequest, 'DYNPUT', this.sessionID)
            .then((hObjDyn) => {
                debug_info(`requester ${this.myID} putting message onto queue ${JSON.stringify(hObjDyn)}`);

                let name = hObjDyn._name;                
                let newDyn = new DynQueue(this.mqclient, hObjDyn, name);                
                this.openDynQueues.push(newDyn);                
                this.pullingTheQueue(newDyn);
                resolve(hObjDyn);
            })
            .catch((err) => {
                debug_warn(`requester ${this.myID} error putting message onto queue ${hObjDyn}`);
                reject(err);
            })
        });
    }

    pullingTheQueue(dynQueue) {        
        setTimeout(() => {                        
            let hObjDyn = dynQueue.getHObjDyn();            
            this.mqclient.performGet(1,hObjDyn)
            .then((message) => {                                    
                if (message.length > 0) {
                    dynQueue.addMessage(message);      
                } else {
                    this.pullingTheQueue(dynQueue);
                }                                    
            })
            .catch((err) => {
                debug_warn(`requester ${this.myID} error pulling message from queue ${err}`);                
                this.pullingTheQueue(dynQueue);
            })            
        }, 5000);       
    } 

    getAppId() {return this.appId;}


}

module.exports = {Requestor};