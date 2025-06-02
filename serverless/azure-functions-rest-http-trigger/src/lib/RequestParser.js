/**
 * Copyright 2025 IBM Corp.
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

const DEFAULT_MESSAGE = "Sample message";

class RequestParser {
    constructor(context) {
        this.qmgr = null;
        this.queue = null;
        this.message = DEFAULT_MESSAGE;
        this.context = context;
        this.quantity = 1 + Math.floor(Math.random() * 10);
    }

    // Parsing the create messages request to see if a 
    // queue manager and queue have been provided
    parseCreateRequest(request) {
        this.context.log("Parsing create request data");
        this.qmgr = request.query.get('QMGR');
        this.queue = request.query.get('QUEUE');

        let ok = true;
        for (let value of [this.qmgr, this.queue]) {
            if (typeof value === 'undefined' || null === value) {
                this.context.log("QMGR / QUEUE is missing from data input");
                ok = false;
            }
        }

        // Check if the request has specified a message
        if (ok) {
            this.message = request.query.get('MESSAGE') || DEFAULT_MESSAGE;
            this.context.log(`Will be posting message [${this.message}] ${this.quantity} times`)
        }

        this.context.log("Create request data parsing completed");
        return ok;
    }

    // Parsing the json data in the process messages request 
    // to see if a queue manager and queue have been provided.
    async parseJsonProcessRequest(request) {
        this.context.log("Parsing process request data");

        let data = await request.json() || '';
        this.context.log("json processed");

        this.context.log("Parsing Json data");
        if (! isObject(data)) {            
            this.context.log("data is not in format expected");
            return false;
        } 

        this.qmgr = data.CE_QMGR;
        this.queue = data.CE_QUEUE;

        let queue_depth = data.CE_DEPTH;
        let registration_id = data.ID;
        let notification = data.notification;

        this.context.log('Requested queue data is: Depth');
        this.context.log(`\t Depth (${queue_depth})`);
        this.context.log(`\t Queue manager (${this.qmgr})`);
        this.context.log(`\t Queue (${this.queue})`);

        this.context.log(`\t Notification (${notification})`);
        this.context.log(`\t Registration (${registration_id})`);

        this.context.log("Json Request data parsed");
        return true;
    }

    getQmgr() {
        return this.qmgr;
    }

    getQueue() {
        return this.queue;
    }

    getMessage() {
        return this.message;
    }

    getQuantity() {
        return this.quantity;
    }

}

function isObject (value) {  
    return Object.prototype.toString.call(value) === '[object Object]'
}

module.exports = {RequestParser};
