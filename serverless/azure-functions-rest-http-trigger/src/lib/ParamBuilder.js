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

const QM_NAME_KEY = "QM_NAME";
const MQ_HOST_KEY = "MQ_HOST";
const MQ_PORT_KEY = "MQ_PORT";
const MQ_APPUSER_KEY = "MQ_APPUSER";
const MQ_PASSWORD_KEY = "MQ_PASSWORD";
const SEP = ":";

const MQ_API_BASE = "/ibmmq/rest/v3/";

const QMGR_KEYS 
    = [QM_NAME_KEY, 
        MQ_HOST_KEY, 
        MQ_PORT_KEY,
        MQ_APPUSER_KEY, 
        MQ_PASSWORD_KEY];

// Uses a combination of request and configuration to build
// the parameters for REST calls to the relevant queue manager.
class ParamBuilder {

    constructor() {
        this.context = {};
        this.qmgrs = new Map();
    }

    // Walk through the configuration looking for queue manager
    // related values. Stash the values in a queue manager keyed
    // map.
    init() {
        let checked = false;
        for (let i = 0; i < 10; i++) {
            let qmgr = {};
            for (let key of QMGR_KEYS) {
                let setting_key = key + SEP + i;
                let setting_value = process.env[setting_key];
                
                if (typeof setting_value === 'undefined') {
                    checked = true;
                    break;
                }
                qmgr[key] = setting_value;
            }
            if (checked) break;
            this.qmgrs.set(qmgr[QM_NAME_KEY], qmgr);
        }
    }

    log_qmgrs() {
        for (let [k, v] of this.qmgrs) {
            this.context.log(`For queue manager ${k}`);
            for (let key of QMGR_KEYS) {
                if (MQ_PASSWORD_KEY !== key) {
                    this.context.log(`${key} is ${v[key]}`); 
                }
            }
        }
    }

    // Use the requested qmgr as a look up to the queue manager
    // stash to build the REST call options.
    _buildRestOptions(qmgr, queue) {
        this.context.log(`Building REST settings for QMGR ${qmgr}`);
        if (! this.qmgrs.has(qmgr)) {
            this.context.log(`Don't know anything about queue manager ${qmgr}`);
            return null;
        }

        const qm = this.qmgrs.get(qmgr);
        const hostname = qm[MQ_HOST_KEY];
        const port = qm[MQ_PORT_KEY];

        this.context.log(`queue manager host is ${hostname}`);
        this.context.log(`queue manager port is ${port}`);

        // pull out all values, and verify all exist.
        if (!(hostname && port)) {
            this.context.log(`Host / Port unknown for queue manager ${qmgr}`);
            return null;
        }

        const username = qm[MQ_APPUSER_KEY];
        const password = qm[MQ_PASSWORD_KEY];

        if (!(username && password)) {
            this.context.log(`Application credentials for queue manager ${qmgr} not provided`);
            return null;
        }

        this.context.log(`app user is ${username}`);

        let restoptions = {
            host: hostname,
            port: port,
            path: MQ_API_BASE + 'messaging/qmgr/' + qmgr + '/queue/' + queue + '/message',
            headers: {
                'Authorization': 'Basic ' + new Buffer.from(username + ':' + password).toString('base64'),
                'ibm-mq-rest-csrf-token': 'abc',
                'Content-Type': 'text/plain'
              }
        };
        
        this.context.log(`REST options for QMGR ${qmgr} built`);

        return restoptions;
    }


    // External facing function allowing functions to request
    // a build of rest call options.
    build(context, parser) {
        this.context = context;
        // this.log_qmgrs();
        const qmgr = parser.getQmgr();
        const queue = parser.getQueue();

        this.context.log("Building params for REST call to MQ");
        return this._buildRestOptions(qmgr, queue);
    }
}

module.exports = {ParamBuilder};
