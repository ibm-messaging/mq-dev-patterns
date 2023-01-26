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

const {Producer} = require('../../models/Producer');
const {Consumer} = require('../../models/Consumer');

// Set Logging options
let debug_info = require('debug')('mqapp-approutes:info');
let debug_warn = require('debug')('mqapp-approutes:warn');

const DEFAULT_LIMIT = 1;

//This function puts a message to a provided queue
function put(req, res, next) {
  let data = req.body;  
  let _message = data.message || 'Default Message app running in Cloud Engine';
  let _quantityInString = data.quantity || "";
  let quantity = parseInt(_quantityInString);
  let _QUEUE_NAME = data.queueName;        

  if (!_QUEUE_NAME || isNaN(quantity)) {
    return res.status(500).send({
        error : "Please provide valid inputs"
    });
  }

  if(quantity < 0 ) {
    debug_info('negating the negative quantity provided!');
    quantity *= -1; 
  } else if (quantity === 0) {
    quantity = 1;
  }
  //Creating a new Producer instance
  let producer = new Producer();
  //Put a number (quantity) of messages (_message) into the queue _QUEUE_NAME
  producer.putMessages(_message, quantity, _QUEUE_NAME)
  .then((statusMsg) => {
    //Put performed successfuly
    res.json({
      status: statusMsg
    });
  })
  .catch((err) => {
    debug_warn("Put has failed with error : ", err);
    return res.status(500).send({
      error: err
    });
  });
}

//This function gets some messages from a queue
function get(req, res, next) {
  let querydata = req.query;   
  let getLimitInString = querydata.limit || DEFAULT_LIMIT;    
  let limit = parseInt(getLimitInString);
  let _QUEUE_NAME = querydata.queueName;

  if (!_QUEUE_NAME || (isNaN(limit) || limit<=0)) {
    return res.status(500).send({
        error : "Please provide valid inputs"
    });
  }
  //create a new Consumer instance
  let consumer = new Consumer();
  //Get a number (limit) of messages from the queue _QUEUE_NAME
  consumer.getMessages(_QUEUE_NAME,limit)
  .then((data) => {
    //data contains the list of messages returned
    res.json(data);
  })
  .catch((err) => {
    return res.status(500).send({
      error : err
    });
  });
  
}


module.exports = {
    get,
    put,
};