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

const axios = require('axios');
const https = require('https');

var debug_info = require('debug')('mqazure:info');
var debug_warn = require('debug')('mqazure:warn');

const ALLOW_SELF_SIGNED_KEY = "ALLOW_SELF_SIGNED";
const MAX_MESSAGES_KEY = "MAX_MESSAGES";
const DEFAULT_MAX_MESSAGES = 8;

let allow_self_signed = checkBooleanEnv(ALLOW_SELF_SIGNED_KEY);
debug_info(`Self sign value is ${allow_self_signed}`);


// Setting to allow REST calls to http servers using self
// signed certificates.
if (allow_self_signed) {
    const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
    });
    axios.defaults.httpsAgent = httpsAgent;
}

// Put a limit on how many messages ProcessMessage will drain 
// per invocation. 
let max_messages = checkNumberEnv(MAX_MESSAGES_KEY, DEFAULT_MAX_MESSAGES);
debug_info(`Max number of messages to process is ${max_messages}`);

function checkBooleanEnv(key) {
    let value = process.env[key];

    debug_info(`Key ${key} has value ${value}`);
    if ((typeof value === 'undefined') || ('true' !== value)) {
        return false
    }
    return value;
}

function checkNumberEnv(key, default_value) {
    let value = process.env[key];  

    if (typeof value !== 'undefined') {
        value = parseInt(value);
        if (Number.isNaN(value)) {
            value = default_value
        }
    } else {
        value = default_value;
    }

    return value;
}

class MQRestAPI {
    constructor() {}

    // Deliberately not wrapping up in a promise
    // to allow return to triggered HTTP request
    processQueue(context, restparams) {
        context.log("Starting queue processing");
        let messages = [];
        this._getFirst(restparams)
            .then((msg) => {
                messages.push(msg);
                debug_info(`Message retrieved ${msg}`);
                this._getRemaining(restparams, messages);
            })
            .catch(() => {
                debug_warn("No message retrieved");
            });
    }

    postMessages(context, restparams, parser) {
        context.log("Starting create messages process");

        let promises = [];

        const numMessages = parser.getQuantity();
        const message = parser.getMessage();

        for (let i = 0; i < numMessages; i++) {
            let msg = `${message} : ${i+1} of ${numMessages}`;
            context.log(`Posting Message ${msg}`);
            promises.push( this._postOne(restparams, msg) );
        }

        return Promise.all(promises);
    }

    // Note switch from Azure function context.log to debug_info
    // This is because the context object will have gone out of scope
    // when the triggering http invocation is responded to. 
    _postOne(restparams, msg) {
        return new Promise((resolve, reject) => {
            debug_info("Putting single message");
            debug_info("Building request");
            let uri = 'https://' + restparams.host + ":" + restparams.port + restparams.path;
            debug_info(`URI is ${uri}`);
            axios({
                method: 'POST',
                url: uri,
                headers: restparams.headers,
                data: msg
            })
            .then((response) => {
                switch (response.status) {
                    case 200:
                    case 201:
                        debug_info("Message Posted successfully");
                        resolve();
                        break;
                    default:
                        debug_warn(`Error Invoking API : ${response.status}`);
                        reject();
                        break;
                  }
            })
            .catch((error) => {
                debug_warn(error.message);
                reject();
            });
        });
    }

    _getFirst(restparams) {
        debug_info("Obtaining first message");
        return this._getOne(restparams);
    }

    // _getRemaining will be invoked after the triggering
    // request has been responded to and after at least one 
    // message has been sucessfully retrieved from the queue
    // manager. Hence it is safe to await the next _getOne call.
    async _getRemaining(restparams, messages) {
        let msg = await this._getOne(restparams);
        if (null !== msg) {
            messages.push(msg);
            if (messages.length < max_messages) {
                return this._getRemaining(restparams, messages);
            } 
        } else {
            this._processMessages(messages);
        }
        return msg;
    }

    // Invokes a DELETE rest call to get a single message of a queue.
    _getOne(restparams) {
        return new Promise((resolve, reject) => {
            debug_info("Obtaining single message");
            debug_info("Building request");
            let uri = 'https://' + restparams.host + ":" + restparams.port + restparams.path;
            debug_info(`URI is ${uri}`);
            axios({
                method: 'DELETE',
                url: uri,
                headers: restparams.headers
            })
            .then((response) => {
                switch (response.status) {
                    case 200:
                    case 201:
                        let msg = {
                            'messageId' : response.headers['ibm-mq-md-messageid'],
                            'message' : response.data
                        };
                        debug_info(`Message processed ${msg.messageId}: ${msg.message}`);
                        resolve(msg);
                        break;
                    case 204:
                        debug_info('No messages on queue');
                        resolve(null);
                        break;
                    default:
                        debug_warn(`Error Invoking API : ${response.status}`);
                        resolve(null);
                        break;
                  }
            })
            .catch((error) => {
                debug_warn(error.message);
                reject(null);
            });
        });
    }

    // Iterates over the array of messages retrieved and processes them.
    _processMessages(messages) {
        debug_info(`Have retrieved ${messages.length} messages`);
        for (let msg of messages) {
            debug_info(`message id [${msg.messageId}]`);
            debug_info(`message data [${msg.message}]`);
          }
    }
}

module.exports = {MQRestAPI};
