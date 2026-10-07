/**
 * Copyright 2022, 2026 IBM Corp.
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
const MQClient = require("../../msms/message-session-manager");
let debug_info = require('debug')('mqapp-utilscontroller:info');
let debug_warn = require('debug')('mqapp-utilscontoller:warn');
let mqclient = new MQClient();
const configuration = Object.assign({}, mqclient.getRESTConfiguration());
let HOST = 'https://';
const DEFAULT_ADMIN = 'admin';

const END_POINT_ALL_DEPTHS = `:${configuration.MQ_QMGR_PORT_API}/ibmmq/rest/v1/admin/qmgr/QM1/queue?type=local&attributes=maxDepth&status=status.currentDepth`;

async function get(req, res) {
    let queryData = req.query;
    let isForSubs = queryData.isForSubs || false;
    const CREDENTIAL = configuration['CREDENTIAL'];
    const END_POINT = HOST + configuration['HOST'] + END_POINT_ALL_DEPTHS;

  let adminUser = CREDENTIAL.ADMIN_USER || ADMIN;
  debug_info('Connecting to MQ using admin user ', adminUser);
  debug_info('Connecting to MQ server at ', END_POINT);

    const axiosCommand = {
        url: END_POINT,
        method: "GET",
        auth: {
            username: CREDENTIAL.ADMIN_USER || ADMIN,
            password: CREDENTIAL.ADMIN_PASSWORD
        },
        headers: {
            'Accept' : 'application/json',
            'ibm-mq-rest-csrf-token': ''
        },
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    };
    try {
        let request = await axios(axiosCommand);
        if (request && request.data && request.data.queue) {
            debug_info('Queue depths obtained');
            let response = resultAdapter(request.data.queue, isForSubs);
            return res.json(response);
        } else {
            return res.status(525).send({
                error: "Error on handling response from the API CALL"
            });
        }
    } catch(e) {
        debug_warn(e);
        return res.status(525).send({
            error: "Error on handling the API CALL"
        });
    }
}

function resultAdapter(result, isForSubs) {
    let response = [];
    result.map(queue => {
        let name = queue['name'];
        let isToAppend = ((name.indexOf('DEV.QUEUE') > -1 && !isForSubs) ||
                    (name.indexOf('APP.REPLIES') > -1 && !isForSubs)) ||
                    (isForSubs && name.indexOf('SYSTEM.MANAGED.NDURABLE') > -1);
        if (isToAppend) {
            let singleQueueEntry = {
                'name': name,
                'depth': queue.status['currentDepth'],
                'maxDepth': queue['maxDepth']
            };
            response.push(singleQueueEntry);
        }
    })
    return response;
}

module.exports = {
    get
};
