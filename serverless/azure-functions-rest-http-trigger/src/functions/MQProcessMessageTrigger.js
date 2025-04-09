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

const { app } = require('@azure/functions');
const { RequestParser } = require('../lib/RequestParser');
const { ParamBuilder } = require('../lib/ParamBuilder');
const { MQRestAPI } = require('../lib/MQRestAPI');

// Instatiate and intialise outside of the trigger handler, 
// so stays warm for re-invocations of the function
const mqparam = new ParamBuilder();
mqparam.init();

const mqrest = new MQRestAPI();

app.http('MQProcessMessageTrigger', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);
        context.log(`method is "${request.method}"`);

        // Parse the request to pull out and verify the required parameters, 
        // which will have come as a JSON object.
        let parser = new RequestParser(context);
        let ok = await parser.parseJsonProcessRequest(request) || false;
        
        context.log("Checking parse status");
        
        if (!ok) {
            context.log("Request processing failed");
            return {status: 400};
        }

        // Build the parameters for the Queue Manager REST call 
        // using a mix of configuration and request.
        let restparams = mqparam.build(context, parser)
        if (null == restparams)
        {
            context.log("Failed to build REST parameters for MQ REST call");
            return {status: 400}; 
        }

        context.log('Ready to process queue');

        // Don't await on this method. 
        // If all is ok then respond with http OK status
        // as request has been received, and verfified
        // The actual message processing can carry on. 
        mqrest.processQueue(context, restparams);

        context.log("Queue processing successfully started");
        return {};
    }
});


