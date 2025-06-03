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
const debug_info = require('debug')('mqsample:otel:app:info');
const debug_warn = require('debug')('mqsample:otel::app:warn');

debug_info('Application is starting');

const express = require('express');

const {appLimits} = require('./settings/limits.js');
const {qmi} = require('./queue-manager/qm-requests.js');
const {ActionData} = require('./data/action.js');


const NO_QMGR_OR_QUEUE = "QMGR / QUEUE is missing from data input";

const HTTP_PORT = parseInt(process.env.PORT || '8080');
const app = express();

app.get('/put', (req, res) => {
    debug_info('Put requested');
    processRequest(req, res, qmi.put); 
});

app.get('/get', (req, res) => {
    debug_info('Get requested')
    processRequest(req, res, qmi.get);
});

function processRequest(req, res, qmiFunc) {
    debug_info('Determining number of messages to process');

    let {data, err} = parseRequest(req);

    if (null === err) {
        debug_info(`Will be processing ${data.num} messages`);
        err = qmiFunc(data);
    }

    if (null !== err) {
        res.status(400).send(err);
        return;
    }

    res.send(JSON.stringify(`Request to process ${data.num} messages on ${data.qmgr} accepted`));
}

function parseRequest(req) {
    let data = {};
    let err = null;

    data = new ActionData();

    data.num = determineNumInRequest(req);

    data.qmgr = req.query.QMGR ? req.query.QMGR : null;
    data.queue = req.query.QUEUE ? req.query.QUEUE : null;

    let ok = true;
    for (let value of [data.qmgr, data.queue]) {
        if (typeof value === 'undefined' || null === value) {
            debug_warn(NO_QMGR_OR_QUEUE);
            ok = false;
        }
    }

    if (!ok) {
        err = NO_QMGR_OR_QUEUE;
    }

    return {data, err};
}


function determineNumInRequest(req) {
    let number = req.query.num ? parseInt(req.query.num.toString()) : NaN;
    if (isNaN(number)) {
        number = appLimits.randomNum();
    } else {
        number = appLimits.applyLimit(number);
    }
    return number;
}

app.listen(HTTP_PORT, () => {
    debug_info(`Listening on port ${HTTP_PORT}`);
});


debug_info('Application has started');