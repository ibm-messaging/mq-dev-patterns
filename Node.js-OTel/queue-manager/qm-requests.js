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
const debug_info = require('debug')('mqsample:otel:qmi:info');
const debug_warn = require('debug')('mqsample:otel:qmi:warn');

const {
    SEMATTRS_CODE_FUNCTION,
    SEMATTRS_CODE_FILEPATH,
  } = require('@opentelemetry/semantic-conventions');

const {MQConnection} = require('./connection.js');
const {envSettings} = require('../settings/environment.js');
const {constants} = require('../settings/constants.js');
const {msgProcessor} = require('../processors/messages.js');

const {otelObjects} = require('../otels/get-otel.js');

const tracer = otelObjects.getTracer(constants.DEFAULT_APP_NAME, constants.DEFAULT_APP_VERSION);

const OTEL_ATTR_TYPE = "SampleApp-MQI-Action-Type";
const OTEL_ATTR_QMGR = "SampleApp-MQI-QMGR";
const OTEL_ATTR_QUEUE = "SampleApp-MQI-QUEUE"

class QueueManagerInterface {
    constructor() {
    }

    put(data) {
        debug_info(`Put requested for ${data.num} messages on Queue ${data.queue} on Queue manager ${data.qmgr}`);
        let err = this.#performActionFrame(constants.PUT, data);
        return err;
    }

    get(data) {
        debug_info(`Get requested for ${data.num} messages on Queue ${data.queue} on Queue manager ${data.qmgr}`); 
        let err = this.#performActionFrame(constants.GET, data);
        return err;
    }

    #performActionFrame(type, data) {
        let err = null;
        let qmgrData = envSettings.dataForQmgr(data.qmgr);

        if (null === qmgrData) {
            err = `Entry for ${data.qmgr} not found`;
        }

        // Up to here, the function calls have been
        // synchronous. Now they become asynchronous.
        if (!err) {
            this.#performAction(type, data, qmgrData);
        }

        // Return the synchronous error, any error
        // in the async logic is reported in logs and
        // instrumentation.
        return err;
    }

    #performAction(type, data, qmgrData) {
        let conn = null; 
        let teardownAttempted = false;

        return tracer.startActiveSpan(        
            constants.GET_ACTIVE_SPAN, 
            { attributes: {   
                OTEL_ATTR_TYPE: constants.PUT,
                OTEL_ATTR_QMGR: data.qmgr,
                OTEL_ATTR_QUEUE: data.queue
                }
            },
            (span) => {
                span.setAttribute(SEMATTRS_CODE_FUNCTION, constants.ATTR_PUT_FUNCTION);
                span.setAttribute(SEMATTRS_CODE_FILEPATH, __filename);

                // Asynchronous functional logic starts here
                conn = new MQConnection(qmgrData);

                conn.connect()
                .then(()=> {
                    return conn.open(type, data.queue);
                    debug_info("Connection established");
                })
                .then(()=> {
                    debug_info("Queue opened");
                    switch (type) {
                        case constants.PUT:
                            return conn.put(data.num, constants.GREETING);
                            break;
                        case constants.GET:
                            return conn.get(data.num);
                            break;
                        default:
                            return Promise.reject(`${type} request not understoood`);
                            break
                    }
                })
                .then((messages)=> {
                    if (type == constants.GET) {
                        debug_info(`Processing messages returned`);
                        msgProcessor.process(messages)
                    }
                    return Promise.resolve
                })
                .then(()=> {
                    teardownAttempted = true;
                    // Close the span for successful processing
                    span.end();

                    debug_info(`${type} action completed, tearing down connection`);
                    return conn.teardown();
                })
                .catch((err) => {
                    // Don't propogate the error, as it will be logged, but
                    // original request will already have been acknowledged as
                    // accepted.
                    debug_warn("Failure in processing request");
                    if (err instanceof Error) {
                        span.recordException(err);
                        // Log span details, so can search in instrumentation traces.
                        debug_warn(err.message, {
                            spanId: span?.spanContext().spanId,
                            traceId: span?.spanContext().traceId,
                            traceFlag: span?.spanContext().traceFlags,
                        });
                    }

                    if (!teardownAttempted) {
                        // Close the span for unsuccessful processing
                        span.end();

                        // The span has already been closed, so
                        // no need to add if teardown also fails.
                        conn.teardown()
                            .then(()=> {})
                            .catch((err)=> {debug_warn("Error in teardown")});
                    }
                    // debug_warn(err);
                    conn.reportError(err);
                  });            
                // Asynchronous functional logic ends here
            });
    }

}   



//const qmi = new QueueManagerInterface();

module.exports = { QueueManagerInterface };