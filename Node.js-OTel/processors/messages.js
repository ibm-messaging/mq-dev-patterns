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

const TRACE_INDEX = 2;
const SPAN_INDEX = 3;

class MessageProcessor {
    #ErrorMsgCounter = null;
    #ErrorGetCounter = null;
    constructor() {
        this.#initCounters();
    }

    #initCounters() {
        const meter = otelObjects.getMeter(constants.DEFAULT_APP_NAME, constants.DEFAULT_APP_VERSION);
        if (meter) {
            this.#ErrorMsgCounter = meter.createCounter(constants.DAMAGED_MSG_COUNTER_ID);
            this.#ErrorGetCounter = meter.createCounter(constants.DAMAGED_GET_CYCLE_COUNTER_ID);
        }
    }

    process(messages) {
        debug_info("Processing messages");
        let damagedFound = false;
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
                if (this.#handleMessage(msg)) {
                    damagedFound = true;
                }
            }
            if (damagedFound) {
                this.#recordGetMeter();
            }
        }
    }

    #handleMessage(msg) {
        debug_info(msg);
        if (msg[constants.DAMAGED_KEY]) {
            debug_warn("Found damaged message");
            this.#recordTrace(msg);
            this.#recordMsgMeter();
            return true;
        }
        return false;
    }

    #recordTrace(msg) {
        const tracer = otelObjects.getTracer(constants.DEFAULT_APP_NAME, constants.DEFAULT_APP_VERSION);
        if (tracer) {
            const span = tracer.startSpan(constants.DAMAGED_MSG_SPAN);
            let {traceid, spanid} = this.#extraceTraceSpanID(msg[constants.TRACE_PARENT_KEY]);
            span.addEvent('Damaged message found', {
                'TraceParent' : msg[constants.TRACE_PARENT_KEY] || '',
                'ParentTrace' : traceid,
                'ParentSpan' : spanid
            });
            span.setStatus({
                code: opentelemetry.SpanStatusCode.ERROR,
                message: 'Error condition detected'
            });
            span.end();
        }
    }

    #recordMsgMeter() {
        if (this.#ErrorMsgCounter) {
            this.#ErrorMsgCounter.add(1);
        }
    }

    #recordGetMeter() {
        if (this.#ErrorGetCounter) {
            this.#ErrorGetCounter.add(1);
        }
    }


    // The Trace parent found in the message properties 
    // will look something like
    //  00-72bcd75bc6d4bcff6424dda0a551b60f-e28db55e5c248ad8-01
    // where
    //  Trace :  72bcd75bc6d4bcff6424dda0a551b60f
    //  Span : e28db55e5c248ad8
    #extraceTraceSpanID(traceparent) {
        const re = /(\w+)-(\w+)-(\w+)-(\w+)/i;
        let matches = traceparent.match(re);

        let parentTrace = null;
        let parentSpan = null; 

        if (matches) {
            const l = matches.length;
            if (l > TRACE_INDEX) {
                parentTrace = matches[TRACE_INDEX];
            }
            if (l > SPAN_INDEX) {
                parentSpan = matches[SPAN_INDEX];
            }
        }

        return { 'traceid' : parentTrace, 'spanid': parentSpan };
    }

}   

const msgProcessor = new MessageProcessor();

module.exports = {
    msgProcessor
};