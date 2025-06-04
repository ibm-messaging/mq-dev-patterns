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

    #mqcno = null;

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

        // debug_info(this.#qmgrData);

        if (this.#qmgrData[constants.APP_USER]) {
            let csp = new mq.MQCSP();
            csp.UserId = this.#qmgrData[constants.APP_USER];
            csp.Password = this.#qmgrData[constants.APP_PASSWORD];
            mqcno.SecurityParms = csp;
        }

        let sco = this.#determineSCO(mqcno);

        // Make the MQCNO refer to the MQCD
        mqcno.ClientConn = this.#buildClientConnection(mqcno);
        this.#mqcno = mqcno;

        debug_info("MQ connection object created");
    }

    #determineSCO(mqcno) {
        let sco = null;
        if (this.#qmgrData[constants.KEY_REPOSITORY]) {
          debug_info('Key Repository has been specified');
          // *** For TLS ***
          sco = new mq.MQSCO();
          sco.KeyRepository = this.#qmgrData[constants.KEY_REPOSITORY];
          // And make the CNO refer to the SSL Connection Options
          mqcno.SSLConfig = sco;
        }
        return sco;
    }

    #getConnection() {
        return `${this.#qmgrData[constants.QM_HOST]}(${this.#qmgrData[constants.QM_PORT]})`;
    }

    #buildClientConnection(mqcno) {
        // No CCDT being used here
        // Fill in relevant fields for the MQCD
        let cd = new mq.MQCD();
        cd.ChannelName = this.#qmgrData[constants.CHANNEL];
        cd.ConnectionName = this.#getConnection();

        debug_info('Connections string is ', cd.ConnectionName);
    
        if (this.#qmgrData[constants.KEY_REPOSITORY]) {
            debug_info('Will be running in TLS Mode');
    
            // *** For TLS ***
            cd.SSLCipherSpec = this.#qmgrData[constants.CIPHER];
            cd.SSLClientAuth = MQC.MQSCA_OPTIONAL;
    
            // And make the CNO refer to the SSL Connection Options
            mqcno.SSLConfig = sco;
        }

        return cd;
    }
    
}   

// const mqConnection = new MQConnection();

module.exports = { MQConnection };
