/**
 * Copyright 2021, 2022 IBM Corp.
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


// Mapping of environment options to how they are required by the REST Api
// functions.
const envOptions = {
  'MQ_USER' : 'user',
  'MQ_PASSWORD': 'password',
  'QUEUE' : 'queue',
  'QM_NAME' : 'qm_name',
  'HOSTNAME' : 'hostname',
  'QM_PORT' : 'port'
}


// This class performs REST API parameter checking and builds REST API
// parameters for each call.
class MQRestParamBuilder {
  constructor() {}

  _basicParams(rawargs) {
    let username = rawargs.user;
    let password = rawargs.password;
    let queue = rawargs.queue;
    let qMgr = rawargs.qm_name;
    let hostname = rawargs.hostname;
    let port = rawargs.port;
    let apiBase = "/ibmmq/rest/v2/";

    let error = "";

    if (!username) {
      error += "Missing MQ User. ";
    }
    if (!password) {
      error += "Missing MQ Password. ";
    }
    if (!queue) {
      error += "Missing Queue. ";
    }
    if (!qMgr) {
      error += "Missing Queue Manager. ";
    }
    if (!hostname) {
      error += "Missing Host. ";
    }
    if (!port) {
      error += "Missing Port. ";
    }

    var options = {}

    if (error.length > 0) {
      options.error = error;
    } else {
      options = {
        host: hostname,
        port: port,
        path: apiBase + "messaging/qmgr/" + qMgr + "/queue/" + queue + "/message",
        // authentication headers
        headers: {
          'Authorization': 'Basic ' + new Buffer.from(username + ':' + password).toString('base64'),
          'ibm-mq-rest-csrf-token': '',
          'Content-Type': 'text/plain'
        }
      };
    }
    return options;
  }

  buildGetParams (rawargs) {
    return new Promise((resolve, reject) => {
      let options = this._basicParams(rawargs);
      if (options.error) {
        reject(options.error);
      } else {
        resolve(options);
      }
    });
  }

  buildPostParms (rawargs) {
    return new Promise((resolve, reject) => {
      let message = rawargs.message;
      let options = this._basicParams(rawargs);

      if (options.error) {
        reject(options.error);
      } else {
        if (!message) {
          message = "Message sent from MQPost cloud function action at " + new Date().toUTCString();
        }
        options.message = message;
        resolve(options);
      }
    });
  }

  buildDeleteParams (rawargs) {
    return new Promise((resolve, reject) => {
      let messageId = rawargs.messageId;
      let options = this._basicParams(rawargs);

      if (options.error) {
        reject(options.error);
      } else if (!messageId) {
        reject("Missing Message Id.");
      } else {
        options.qs = {'messageId': messageId};
        resolve(options);
      }
    });
  }

  buildParamsForAWS(message) {
    return new Promise((resolve, reject) => {
        let awsargs = {};

        Object.entries(envOptions).forEach(([key, value]) => {
          if (key in process.env) {
            awsargs[value] = process.env[key];
          }
        });

        let restoptions = this._basicParams(awsargs);

        if (restoptions.error) {
          console.log('Error Detected : ', restoptions.error);
          reject(restoptions.error);
        } else {
          console.log('Checking for message');
          if (!message) {
            message = "Message sent from AWS Serverless Lambda Post function at " + new Date().toUTCString();
          }
          restoptions.message = message;
          resolve(restoptions);
        }
    });
  }

}

module.exports = MQRestParamBuilder;
