/**
 * Copyright 2022 IBM Corp.
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

const MQRest = require('../lib/mqrestapi.js');
const MQParamBuilder = require('../lib/parambuilder.js');

let response;

const PATH = 'path';
const QUERYSTRING = 'queryStringParameters';
const MESSAGE = 'msg';

let mqrest = new MQRest();
let mqparam = new MQParamBuilder();

// Set up debug logging options
var debug_info = require('debug')('mqazure:info');
var debug_warn = require('debug')('mqazure:warn');

checkPath = (apipath) => {
  if (apipath) {
    let pathvalue = apipath.replace(/^\//, '');
    debug_info("cleansed path is ", pathvalue);
  } else {
    debug_warn("path not set on invocation");
  }
}

/**
 *
 * @param {Object} event 
 *
 * @param {Object} context
 *
 * @returns {Object} object 
 *
 */
module.exports = async function (event, context, req) {
  return new Promise(function(resolve, reject) {
    let msg = '';

    if (event) {
      checkPath(event[PATH]);

      if (event[QUERYSTRING] && event[QUERYSTRING][MESSAGE]) {
        debug_info("found query string set to ", event[QUERYSTRING]);
        msg = event[QUERYSTRING][MESSAGE];
      }
    }

    mqparam.buildParamsForAzure(msg)
    .then((params) => {
      debug_info('Call params set to : ');
      debug_info(params);
      return mqrest.postMessage(params);
    })
    .then((messageId) => {
      response = {
          'statusCode': 200,
          'headers': {'Content-Type': 'application/json'},
          'body': JSON.stringify({
              'message': 'Message put was successful',
              'messageId' : messageId
          })
      };
      resolve(response);
    })
    .catch((err) => {
      debug_warn(err);
      response = {
          'statusCode': 400,
          'headers': { 'Content-Type': 'application/json' },
          'body': JSON.stringify({'Error:': err, 'statusCode' : 400})
      };
      resolve(response);
    });
  });
}
