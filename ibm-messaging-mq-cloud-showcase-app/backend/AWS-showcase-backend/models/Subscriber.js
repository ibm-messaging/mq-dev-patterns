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
const {DeQueue} = require('./DeQue');
const MQClient = require("../msms/message-session-manager");

//Set Logging options
let debug_info = require('debug')('mqapp-subscriber:info');
let debug_warn = require('debug')('mqapp-subscriber:warn');

const MAX_STASH_WARNINGS = 5;

class Subscriber {
    
    constructor(appId) {        
        this.appId = appId;
        this.hObjQueue = undefined;
        this.messages = new DeQueue();  
        this.mqclient = new MQClient(); 
        this.suicidePill = false;
        this.warningCount = 0;        
        this.myID = uuidv4();        
    }
    
    makeSubscription(topic) {   
        debug_info(`Subscriber ${this.myID} making subscription to topic ${topic}`);                
        this.suicidePill = false;
        return new Promise((resolve, reject) => {
            debug_info(`Subscriber ${this.myID} sending subscription mqclient`); 
            this.mqclient.sub(topic)
            .then((hObj) => {
                this.hObjQueue = hObj;
                debug_info(`Subscriber ${this.myID} starting background message poller`); 
                this.pullingTheQueue();
                resolve(true);                
            })
            .catch((err) => {            
                reject(err);
            })  
        });                        
    }

    deleteSubscription() {        
        // since the subscribers are non-durable 
        // closing the connection will result in 
        // unsubscribing
        return new Promise((resolve, reject) => {
            this.mqclient.performCleanUp()
            .then(() => {   
                debug_info(`Subscriber ${this.myID} connection closed`);  
                this.killThePoll();     
                resolve();
            })
            .catch((err) => {
                debug_warn(`Subscriber ${this.myID} error on connection close ${err}`); 
                reject();
            })
        });        
    }    

    pullingTheQueue() {
        let myID = uuidv4();
        let pubID = this.myID;
        debug_info(`Starting Message Poll ${myID}`);

        if (this.suicidePill) {
            debug_info(`Subscriber Poll ${myID} has been told to die`);
            return;
        }

        setTimeout(() => {  
            debug_info(`Subscriber ${pubID} poll ${myID} waking`);        
            this.mqclient.performGet(1,this.hObjQueue)
            .then( async (message) => {  
                debug_info(`Subscriber ${pubID} poll ${myID} message received`);         
                if (message && message.length > 0) {
                    debug_info(`Subscriber ${pubID} poll ${myID} stashing message ${message}`);
                    let messageStashedOK = await this.messages.push(message);    
                    if (!messageStashedOK) {
                        debug_warn(`Subscriber ${pubID} poll ${myID} detected overgrown message stash`);
                        this.warningCount++;
                        if (MAX_STASH_WARNINGS < this.warningCount) {
                            debug_warn(`Subscriber ${pubID} poll ${myID} Exceeded warning count`);
                            this.killThePoll();
                        }
                    }                                   
                }           
                this.pullingTheQueue();                                
            })
            .catch((err) => {  
                debug_info(`Subscriber ${pubID} poll ${myID} error thrown ${err}`);              
                this.pullingTheQueue();
            })            
        }, this.randomNumber(1000,2000));
        
        debug_info(`Subscriber ${pubID} Message Poll ${myID} started`); 
    }    

    // Not really doing anything with limit here
    getMessages(limit) {                        
        return new Promise((resolve, reject) => {
            this.messages.pop()
            .then((message) => {
                if (message === undefined) {
                    message = null;
                }
                debug_info("The resolved message is: ", message);
                resolve(message);
            })
            .catch((err) => {
                reject(err);
            })
        });          
    }    

    killThePoll() {
        debug_info(`Subscriber ${this.myID} polling can end`);
        this.suicidePill = true;
    }

    isReady() {
        return this.mqclient.isReady();
    }

    randomNumber(min, max) {  
        return Math.floor(
            Math.random() * (max - min) + min
        );
    }

    getAppId() { return this.appId; }
    
    getQueue() { return this.hObjQueue; }
    
}

module.exports = {Subscriber};

