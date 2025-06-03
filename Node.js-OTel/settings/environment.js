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
const debug_info = require('debug')('mqsample:otel:environment:info');
const debug_warn = require('debug')('mqsample:otel:environment:warn');

// Load up environment variables from the env.json file
var env = require('../env.json');

class QMEntry {
    constructor() {
        this.QMGR = "";
        this.APP_USER = "";
        this.APP_PASSWORD = "";
        this.QM_HOST = "";
        this.QM_PORT = "",
        this.CHANNEL = "";
    } 
}

class AppEnvironment {
    #MQDetails = {};
    constructor() {
        this.buildDetails();
    }

    buildDetails() {
        debug_info('Loading queue manager environment data');

        if (env.MQ_ENDPOINTS && env.MQ_ENDPOINTS instanceof Array) {
            // Need the index, which forces the array iteration method
            for (let i = 0; i < env.MQ_ENDPOINTS.length; i++) {
                let qme = new QMEntry();
                ['QMGR', 'QM_HOST', 'QM_PORT',
                    'CHANNEL', 'KEY_REPOSITORY', 'CIPHER'].forEach((f) => {
                        qme[f] = process.env[f + '_' + i] || env.MQ_ENDPOINTS[i][f];
                    });
                debug_info(`Entry ${i}:`);
                debug_info(qme);
            }
            debug_info("env.json file processed");
        } else {
            debug_warn("No queue manager endpoints found in env.json file");
        }

        //let i = this.index;

        // if (env.MQ_ENDPOINTS.length > i) {
        //   ['QMGR', 'QUEUE_NAME', 'TOPIC_NAME',
        //     'MODEL_QUEUE_NAME', 'DYNAMIC_QUEUE_PREFIX', 'BACKOUT_QUEUE',
        //     'HOST', 'PORT',
        //     'CHANNEL', 'KEY_REPOSITORY', 'CIPHER'].forEach((f) => {
        //       this.MQDetails[f] = process.env[f] || env.MQ_ENDPOINTS[i][f];
        //     });
        //   ['USER', 'PASSWORD'].forEach((f) => {
        //     let pField = 'APP_' + f;
        //     this.credentials[f] = process.env[pField] || env.MQ_ENDPOINTS[i][pField];
        //   });
        // }
    }
}   


const envSettings = new AppEnvironment();

module.exports = { envSettings };




