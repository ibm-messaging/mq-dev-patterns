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

const opentelemetry = require('@opentelemetry/api');

const { constants } = require('../settings/constants');
const { otelObjects } = require('../otels/get-otel');

// Set up debug logging options
const debug_info = require('debug')('mqsample:otel:messages:info');
const debug_warn = require('debug')('mqsample:otel:messages:warn');

class MessageProcessor {
    constructor() {
    }

    process(messages) {
        debug_info("Processing messages");
        // debug_info(messages);

        // Check that there are messages and presented 
        // as an array
        if (! messages) {
            debug_info("No Messages retrieved");
        } else if (! Array.isArray(messages)) {
            debug_info("Messages not returned as array");
        } else if (0 === messages.length) {
            debug_info("Returned message array is empty");
        } else {
            for (let msg of messages) {
                this.#handleMessage(msg);
            }
        }
    }

    #handleMessage(msg) {
        debug_info(msg);
        if (msg[constants.DAMAGED_KEY]) {
            debug_warn("Found damaged message");
            const tracer = otelObjects.getTracer(constants.DEFAULT_APP_NAME, constants.DEFAULT_APP_VERSION);
            
            if (tracer) {
                const span = tracer.startSpan(constants.DAMAGED_MSG_SPAN);
                span.addEvent('Damaged message found', {
                    'TraceParent' : msg[constants.TRACE_PARENT_KEY] || ''
                });
                span.setStatus({
                    code: opentelemetry.SpanStatusCode.ERROR,
                    message: 'Error condition detected'
                });
                span.end();
            }
        }
    }
    
}   

const msgProcessor = new MessageProcessor();

module.exports = {
    msgProcessor
};