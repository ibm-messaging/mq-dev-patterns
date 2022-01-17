/**
 * Copyright 2021 IBM Corp.
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

const MQRest = require('./lib/mqrestapi.js');
const MQParamBuilder = require('./lib/parambuilder.js');

let mqrest = new MQRest();
let mqparam = new MQParamBuilder();


function main (args) {
    return new Promise((resolve, reject) => {
      console.log("Processing MQ DELETE action");
      console.log("Input args are ", args);

      // Check and build the REST API Call parameters
      // If all is ok then run the REST DELETE to destructively
      // fetch the message.
      // If all is still ok then return the message as output.
      mqparam.buildDeleteParams(args)
      .then((params) => {
        console.log("Call params have been built");
        console.log(params);
        return mqrest.deleteMessage(params);
      }).then((msg) => {
        console.log("Message successfully retrieved");
        console.log("msg is ", msg);
        resolve(msg);
      }).catch((err) => {
        console.log("Error detected ", err);
        reject(err);
      });

    });
}

exports.main = main;
