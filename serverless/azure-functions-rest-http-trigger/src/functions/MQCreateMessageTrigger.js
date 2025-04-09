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

app.http('MQCreateMessageTrigger', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);
        let responseBody = "Request Accepted";
        let responseStatus = 200;

        // Parse the request to pull out and verify the required parameters.
        let parser = new RequestParser(context);
        let ok = parser.parseCreateRequest(request) || false;
        if (!ok) {
            responseBody = "Need QMGR and QUEUE as inputs";
        }
        
        context.log("Checking parse status");
        
        if (!ok) {
            context.log("Request processing failed");
            responseStatus = 400;
        }

        // Build the parameters for the Queue Manager REST call 
        // using a mix of configuration and request.
        let restparams = mqparam.build(context, parser);
        if (null == restparams)
        {
            context.log("Failed to build REST parameters for MQ REST call");
            return {status: 400}; 
        }

        context.log('Ready to post messages onto queue');

        // This method returns an array of promises, but we are not
        // (a)waiting on them as want to return a response to the
        // http trigger that initiated this function.
        mqrest.postMessages(context, restparams, parser);

        return {status: responseStatus, body: responseBody};
    }
});
