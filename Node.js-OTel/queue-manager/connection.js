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

const mq = require('ibmmq');

// Set up debug logging options
const debug_info = require('debug')('mqsample:otel:connection:info');
const debug_warn = require('debug')('mqsample:otel:connection:warn');

const { constants } = require('../settings/constants');

const DEFAULT_APP_NAME = "MQI Otel Node test application";
const MQC = mq.MQC;

class MQConnection {
    #qmgrData = null;
    #applName = "";
    constructor(qmgrData) {
        debug_info(`Creating connection for ${qmgrData[constants.QMGR]}`);

        this.#qmgrData = qmgrData;
        this.#applName = qmgrData.applName || DEFAULT_APP_NAME;
        this.buildMQCNO();
    }

    buildMQCNO() {
        debug_info(`Creating CNO for ${this.#qmgrData[constants.QMGR]} request`);

        let mqcno = new mq.MQCNO();
        mqcno.Options = MQC.MQCNO_CLIENT_BINDING;
    
        // Set Application name
        mqcno.ApplName = this.#applName;

        debug_info(this.#qmgrData);

        // if (this.#qmgrData.USER) {
        //     let csp = new mq.MQCSP();
        //     csp.UserId = this.credentials.USER;
        //     csp.Password = this.credentials.PASSWORD;
        //     mqcno.SecurityParms = csp;
        //   }

    }
}   

// const mqConnection = new MQConnection();

module.exports = { MQConnection };
