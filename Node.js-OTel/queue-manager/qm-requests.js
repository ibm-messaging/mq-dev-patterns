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
        let err = this.#performAction(constants.PUT, data);
        return err;
    }

    get(data) {
        debug_info(`Get requested for ${data.num} messages on Queue ${data.queue} on Queue manager ${data.qmgr}`); 
        let err = this.#performAction(constants.GET, data);
        return err;
    }

    #performAction(type, data) {
        let err = null;

        let qmgrData = envSettings.dataForQmgr(data.qmgr);

        if (null === qmgrData) {
            err = `Entry for ${data.qmgr} not found`;
        }

        if (!err) {
            let conn = null; 
            let teardownAttempted = false;

            conn = new MQConnection(qmgrData);
            conn.connect()
            .then(()=> {
                return conn.open(type, data.queue);
                debug_info("Connection established");
            })
            .then(()=> {
                debug_info("Queue opened");
                switch (type) {
                    case constants.PUT:
                        return conn.put(data.num, constants.GREETING);
                        break;
                    case constants.GET:
                        return conn.get(data.num);
                        break;
                    default:
                        return Promise.reject(`${type} request not understoood`);
                        break
                }
            })
            .then((messages)=> {
                if (type == constants.GET) {
                    debug_info(`Processing messages returned`);
                    debug_info(messages);
                }
                return Promise.resolve
            })
            .then(()=> {
                teardownAttempted = true;
                debug_info(`${type} action completed, tearing down connection`);
                return conn.teardown();
            })
            .catch((err) => {
                // Don't propogate the error, as it will be logged, but
                // original request will already have been acknowledged as
                // accepted.
                debug_warn("Failure in processing request");
                if (!teardownAttempted) {
                    conn.teardown()
                        .then(()=> {})
                        .catch((err)=> {debug_warn("Error in teardown")});
                }
                // debug_warn(err);
                conn.reportError(err);
              });            
        }

        return err;
    }
}   

//const qmi = new QueueManagerInterface();

module.exports = { QueueManagerInterface };