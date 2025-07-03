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
const debug_info = require('debug')('mqsample:otel:constants:info');
const debug_warn = require('debug')('mqsample:otel:constants:warn');

class AppConstants {
    constructor() {
        this.QMGR = "QMGR";
        this.QM_HOST = "QM_HOST";
        this.QM_PORT = "QM_PORT";
        this.CHANNEL = "CHANNEL";
        this.APP_USER = "APP_USER";
        this.APP_PASSWORD = "APP_PASSWORD";
        this.KEY_REPOSITORY = "KEY_REPOSITORY";
        this.CIPHER = "CIPHER";

        this.PUT = "put";
        this.GET = "get";

        this.GREETING = "Otel Message ";
        this.DEFAULT_ENV_FILE = "../env.json";
        this.ENV_FILE_KEY = "EnvFile";

        this.MAX_LIMIT = 10;
        this.DEFAULT_SENSITIVIY = 5;
        this.SENSITIVIY_KEY = "ErrorSensitivity";

        this.DAMAGED_KEY = 'Damaged';

        this.DEFAULT_APP_NAME = "MQI-Otel-Node-app";
        this.DEFAULT_APP_VERSION = "0.0.1";

        this.USE_JAEGER_KEY = 'USE_JAEGER';
        this.USE_PROMETHEUS_KEY = 'USE_PROMETHEUS';

        this.GET_ACTIVE_SPAN = 'MQI-Sample-Span';
        this.ATTR_PUT_FUNCTION = 'qm-requests-put';

        this.DAMAGED_MSG_SPAN = 'Damaged-Message-Span';
        this.DAMAGED_MSG_COUNTER_ID = 'MQI-sample-app-damaged-message-count'
        this.DAMAGED_GET_CYCLE_COUNTER_ID = 'MQI-sample-app-damaged-get-request-count'

        this.TRACE_PARENT_KEY = `traceparent`;
    }

    qm_data_keys() {
        return [this.QMGR, this.QM_HOST, this.QM_PORT,
            this.CHANNEL, this.APP_USER, this.APP_PASSWORD,
            this.KEY_REPOSITORY, this.CIPHER]
    }
}   

const constants = new AppConstants();

module.exports = { constants };