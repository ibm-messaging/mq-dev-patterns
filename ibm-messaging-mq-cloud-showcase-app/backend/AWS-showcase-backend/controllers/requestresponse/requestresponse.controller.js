/**
 * Copyright 2022, 2023 IBM Corp.
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

const { request } = require('express');
const {Requestor} = require('../../models/Requestor');
const {Responder} = require('../../models/Responder');

// Set Logging options
let debug_info = require('debug')('mqapp-approutes:info');
let debug_warn = require('debug')('mqapp-approutes:warn');

const DEFAULT_LIMIT = 1;
let applications = []

// This function put a messager for either 
// a Requestor or a Responder
function putReq(req, res, next) {
  try{            
    let data = req.body;        
    let appId = data.appId || -1;
    let _message = data.message || 'Default Message app running in Cloud Engine';
    let _quantityInString = data.quantity || "";
    let quantity = parseInt(_quantityInString);
    let _QUEUE_NAME = data.queueName;
    let sessionID = data.sessionID || -1;
    let type = data.type;

    if (!appId || !type || !quantity) {
      return res.status(500).send({
          error : "Please provide valid inputs"
      });
    }

    if(quantity < 0 ){
      debug_info('negating the negative quantity provided!');
      quantity *= -1; 
    } else if (quantity === 0) {
      quantity = 1;
    }
    // Looking for the application with appId = appId
    let isExitingAppId = applications.findIndex(x => x.getAppId() === appId);        
    let application;
    // If the application with appId has not been found in applications
    if(isExitingAppId <= -1) {
      // If the put request has been requested from a Requestor
      if(type === 'DYNPUT') {
        // Create a new Requestor object
        let newRequestor = new Requestor(appId, sessionID);
        // Add the new requestor to the application's list
        applications.push(newRequestor);
        // Set the current application as the newRequestor
        application = newRequestor;
      } else if (type === 'DYNREP') { // If the put request has been requested from a Responder
        // Create a new Responder object
        let newResponder = new Responder(appId);
        // Add the new responder to the application's list
        applications.push(newResponder);
        console.log("Creating new responder");
        // Set the current application as the newResponder
        application = newResponder;
      }
    } else { 
      //If the application with appId = appId has been found, 
      // save the object into the application variable
      application = applications[isExitingAppId];
    }
    console.log("Current applications:" + applications); 
    //Perform the put request for either the Responder or the Requestor
    application.putToQueue(_QUEUE_NAME,_message,quantity)
    .then((hObjDyn) => {
      //This hObjDyn will stores the name of the reply-toQueue
      return res.send(hObjDyn);
    })
    .catch((err) => {
      debug_warn("Put has failed with error : ", err);
      return res.status(500).send({
        error: err
      });
    });

  }catch(err) {
    debug_warn("Error: " + err);
    return res.status(500).send({
      error : err
    });
  }
    return;
}
// This function get a message from either
// a Requestor or a Responder
function getRes(req, res, next) {
  let querydata = req.query;     
  let getLimitInString = querydata.limit || DEFAULT_LIMIT;    
  let limit = parseInt(getLimitInString);
  let _QUEUE_NAME = querydata.queueName;
  let appId = querydata.appId;
  let type = querydata.type ;
  
  if (!appId || !type || (isNaN(limit) || limit <=0 )) {
    return res.status(500).send({
        error : "Please provide valid inputs"
    });
  }
  // Looking for the applicaiton with appId = appId in applications
  let isExitingAppId = applications.findIndex(x => x.getAppId() === appId);
  let application;
  // If the application with appId has not been found in applications
  if(isExitingAppId <= -1) {
    // If the get request has been requested from a Requestor
    if(type === 'DYNPUT') {
      // Create a new Requestor object
      let newRequestor = new Requestor(appId, sessionID);
      applications.push(newRequestor);
      application = newRequestor;
      console.log("Creating new Requestor");
    } else if (type === 'DYNREP') { // If the get request has been request from a Responder
      // Create a new Responder object
      let newResponder = new Responder(appId);
      applications.push(newResponder);
      application = newResponder;
      console.log("Creating new Responder");
    }
  } else {
    // If the application with appId = apId has been found, 
    // save the object into the application varibale
    application = applications[isExitingAppId];
  }
  // Perform the get request for either the Responder or the Requestor
  application.getMessageFromQueue(_QUEUE_NAME)
  .then((messages) => {
    return res.json(messages);;
  })
  .catch((err) => {
    return res.status(500).send({
      error : err
    });
  });

}

module.exports = {
    putReq,
    getRes    
};