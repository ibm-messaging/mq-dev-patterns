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
const debug_info = require('debug')('mqsample:otel:limits:info');
const debug_warn = require('debug')('mqsample:otel:limits:warn');

const {constants} = require('./constants');
const MAX_LIMIT = constants.MAX_LIMIT;

const SENSITIVIY = process.env[constants.SENSITIVIY_KEY] || constants.DEFAULT_SENSITIVIY;

debug_info(`Failing sensitivity set to 1 in ${SENSITIVIY}`);

class AppLimits {
    constructor() {
    }

    randomNum() {
        return Math.floor(Math.random() * MAX_LIMIT) + 1;
    }

    applyLimit(number) {
        debug_info(`Checking requested number ${number} for limits`);
        if (number > MAX_LIMIT || number < 1) {
            return this.randomNum();
        }
        return number;
    }

    shouldItFail() {
        let v =  Math.floor(Math.random() * SENSITIVIY) + 1;
        if (1 == v) {
            return true;
        }
        return false;
    }
}   

const appLimits = new AppLimits();

module.exports = {
    appLimits
};