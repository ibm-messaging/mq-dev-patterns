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
const {qm} = require('./qm.js');


const HTTP_PORT = parseInt(process.env.PORT || '8080');
const app = express();

app.get('/put', (req, res) => {
    debug_info('Put requested');
    debug_info('Determining number of puts required');

    let numPuts = determineNumInRequest(req);
    debug_info(`Will be sending ${numPuts} messages`);

    res.send(JSON.stringify(`Sending ${numPuts} messages`));
    
});

app.get('/get', (req, res) => {
    debug_info('Get requested');
    debug_info('Determining number of gets required');

    let numGets = determineNumInRequest(req);
    debug_info(`Will be getting ${numGets} messages`);

    res.send(JSON.stringify(`Sending ${numGets} messages`));
    
});

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


debug_info('Application is ending');