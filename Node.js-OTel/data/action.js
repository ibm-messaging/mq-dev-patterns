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
const debug_info = require('debug')('mqsample:otel:actiondata:info');
const debug_warn = require('debug')('mqsample:otel:actiondata:warn');

class ActionData {
    // private properties only accessible through getters and setters
    #num = 0;
    #qmgr = null;
    #queue = null;

    constructor() {
    }

    get num() {return this.#num;}
    get qmgr() {return this.#qmgr;}
    get queue() {return this.#queue;}


    set num(n) {return this.#num = n;}
    set qmgr(qm) {return this.#qmgr = qm;}
    set queue(q) {return this.#queue = q;}
}   

module.exports = { ActionData };
