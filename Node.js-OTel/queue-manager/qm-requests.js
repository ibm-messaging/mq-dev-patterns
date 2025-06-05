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

// Set up debug logging options
const debug_info = require('debug')('mqsample:otel:qmi:info');
const debug_warn = require('debug')('mqsample:otel:qmi:warn');

const {MQConnection} = require('./connection.js');
const {envSettings} = require('../settings/environment.js');
const { constants } = require('../settings/constants.js');


const MAX_LIMIT = 10;

class QueueManagerInterface {
    constructor() {
    }

    put(data) {
        debug_info(`Put requested for ${data.num} messages on Queue ${data.queue} on Queue manager ${data.qmgr}`);

        let err = this.#initConnection(constants.PUT, data);

        return err;
    }

    get(data) {
        debug_info(`Get requested for ${data.num} messages on Queue ${data.queue} on Queue manager ${data.qmgr}`); 

        let err = this.#initConnection(constants.GET, data);

        return err;
    }

    #initConnection(type, data) {
        let err = null;

        let qmgrData = envSettings.dataForQmgr(data.qmgr);

        if (null === qmgrData) {
            err = `Entry for ${data.qmgr} not found`;
        }

        let conn = null; 
        if (!err) {
            conn = new MQConnection(qmgrData);
            conn.connect()
            .then(()=> {
                return conn.open(type, data.queue);
                debug_info("Connection established");
            })
            .then(()=> {
                debug_info("Queue opened");
            })
            .catch((err) => {
                // Don't propogate the error, as it will be logged, but
                // original request will already have been acknowledged as
                // accepted.
                debug_warn("Unable to create connection");
                // debug_warn(err);
                QueueManagerInterface.#reportError(err);
              });            
        }

        return err;
    }

    static #reportError(err) {
        let errMsg =  err.message || err;
        debug_warn("MQ call failed with error : " + errMsg);
    }
}   

//const qmi = new QueueManagerInterface();

module.exports = { QueueManagerInterface };