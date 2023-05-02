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

const MQClient = require("../msms/message-session-manager");

class Producer {
    constructor() {        
        this.mqclient = new MQClient();        
    }

    closeConnection() {
        return new Promise((resolve, reject) => {
            this.mqclient.cleanUp()
            .then((res) => {
                resolve(res)
            })
            .catch((err) => {
                reject(err);
            })
        })
    }

    putMessages(message, quantity, queueName, currency) {

        let _putRequest = {
            message : message,
            quantity : quantity,
            queueName : queueName,
            currency : currency
        };

        return new Promise((resolve, reject) => {
            this.mqclient.put(_putRequest)
            .then((statusMsg) => {
                resolve(statusMsg);
            })
            .catch((err) => {
                reject(err);
            });
        });
    }
}

module.exports = {Producer};