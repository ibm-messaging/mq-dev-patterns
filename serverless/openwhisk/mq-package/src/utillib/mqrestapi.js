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

const axios = require('axios');

// This class acts as the REST CAll manager. All MQ Rest calls are invoked
// as methods on this class.
class MQRestAPI {
  constructor() {}

  browseForMsg(options) {
    return new Promise(function resolver(resolve, reject) {
      //console.log('Configuration looks like ', config);
      //console.log('Connection information looks like ', connection);
      console.log('https://' + options.host + options.path);
      let uri = 'https://' + options.host + options.path;
      axios({
        method: 'GET',
        url: uri,
        headers: options.headers,
      })
      .then(function(response) {
        console.log('Status code is ',  response.status);
        console.log('Message Id:');
        console.log(response.headers['ibm-mq-md-messageid']);
        // console.log('Headers are:');
        // console.log(response.headers);
        // console.log("Full response is:")
        // console.log(response);
        switch (response.status) {
          case 200:
          case 201:
            resolve(response.headers['ibm-mq-md-messageid']);
            break;
          case 204:
            reject('Queue is empty');
            break;
          default:
            reject('Error Invoking API ' + response.statusCode);
            break;
          }
        }).catch(function(err) {
          console.log("REST call error : ", err);
          reject(err);
        });
    });
  }

  deleteMessage (options) {
    return new Promise((resolve, reject) => {
      console.log("Retrieving message from MQ Queue");
      let uri = 'https://' + options.host + options.path;
      axios({
        method: 'DELETE',
        url: uri,
        params: options.qs,
        headers: options.headers,
      })
      .then(function(response) {
        console.log('Status code is ',  response.status);
        console.log('Message Id:');
        console.log(response.headers['ibm-mq-md-messageid']);
        console.log("Data found : ", response.data);
        //console.log("Dumping full response");
        //console.log(response);
        switch (response.status) {
          case 200:
          case 201:
            let msg = {
              'messageId' : response.headers['ibm-mq-md-messageid'],
              'message' : response.data
            };
            resolve(msg);
            break;
          case 204:
            reject('Message not found on queue');
            break;
          default:
            reject('Error Invoking API ' + response.status);
            break;
        }
       }).catch(function(err) {
          console.log("REST call error : ", err);
          reject(err);
       });
    });
  }

  postMessage (options) {
    return new Promise((resolve, reject) => {
      console.log("Posting message to MQ Queue");
      let uri = 'https://' + options.host + options.path;
      axios({
        method: 'POST',
        url: uri,
        data: options.message,
        headers: options.headers,
      })
      .then(function(response) {
        console.log('Status code is ',  response.status);
        console.log('Message Id:');
        console.log(response.headers['ibm-mq-md-messageid']);
        switch (response.status) {
          case 200:
          case 201:
            resolve(response.headers['ibm-mq-md-messageid']);
            break;
          default:
            reject('Error Invoking API ' + response.status);
            break;
        }
       }).catch(function(err) {
          console.log("REST call error : ", err);
          reject(err);
       });
    });
  }

}

module.exports = MQRestAPI;
