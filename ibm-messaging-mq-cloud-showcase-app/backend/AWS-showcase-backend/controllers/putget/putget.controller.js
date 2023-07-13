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
const { DeQueue } = require('../../models/DeQue');

// Set Logging options
let debug_info = require('debug')('mqapp-approutes:info');
let debug_warn = require('debug')('mqapp-approutes:warn');

let consumers = new DeQueue();
let producer;
const DEFAULT_LIMIT = 1;

//This function puts a message to a provided queue
function put(req, res, next) {
  let data = req.body;  
  let _message = data.message || 'Default Message app running in Cloud Engine';
  let _quantityInString = data.quantity || "";
  let quantity = parseInt(_quantityInString);
  let _QUEUE_NAME = data.queueName;        
  let currency = data.currency;
  
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
  producer = new Producer();
  //Put a number (quantity) of messages (_message) into the queue _QUEUE_NAME
  producer.putMessages(_message, quantity, _QUEUE_NAME, currency)
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

async function closeProducerConnection(req, res) {
  if (producer) {
    return await producer.closeConnection()
    .then((response) => {
      return res.json({
        status: response
      })
    })
    .catch((err) => {      
    })  
  } else {
    return res.json({
      status: "init producer"
    })
  }
  
}

async function closeConsumerConnection(req, res) {
  let queryData = req.query;
  let consumerId = queryData.consumerId;

  if (!consumerId) {
    return res.status(500).send({
      error: "Please provide a valid id"
    });
  }

  let consumer = await consumerObjectAleadyExistingFromAppId(consumerId);

  if (consumer === -1) {
    return res.status(500).send({
      error : "This consumer does not exist"
    });
  }  else {
    consumer.closeConnection()
    .then((data) => {      
      res.json(data);
    })
    .catch((err) => {
      return res.status(500).send({
        error : err
      });
    });
  }

  
}

//This function returns a subscriber object from its appId
async function consumerObjectAleadyExistingFromAppId(appId) {    
  return await consumers.findObjectByAppId(appId)
  .then((consumer) => consumer)        
  .catch((err) => {
      debug_warn(`Error on looking for the subscriber ${appId}`);
      return -1;
  });
}

async function getCodingChallange(req, res, next) {
  let querydata = req.query;   
  let getLimitInString = querydata.limit || DEFAULT_LIMIT;    
  let limit = parseInt(getLimitInString);
  let _QUEUE_NAME = querydata.queueName;
  let currency = querydata.currency;
  let consumerId = querydata.consumerId;

  if (!_QUEUE_NAME || (isNaN(limit) || limit<=0) || !consumerId) {
    return res.status(500).send({
        error : "Please provide valid inputs"
    });
  }

  let consumer = await consumerObjectAleadyExistingFromAppId(consumerId);

  if(consumer === -1) {
    // creating new consumer
    consumer = new Consumer(consumerId);
    await consumers.push(consumer);
  }

  consumer.getMessages(_QUEUE_NAME,limit, currency)
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

function getCodingChallange(req, res, next) {
  let querydata = req.query;   
  let getLimitInString = querydata.limit || DEFAULT_LIMIT;    
  let limit = parseInt(getLimitInString);
  let _QUEUE_NAME = querydata.queueName;
  let currency = querydata.currency;

  if (!_QUEUE_NAME || (isNaN(limit) || limit<=0)) {
    return res.status(500).send({
        error : "Please provide valid inputs"
    });
  }
  //create a new Consumer instance
  let consumer = new Consumer();
  //Get a number (limit) of messages from the queue _QUEUE_NAME
  consumer.getMessages(_QUEUE_NAME,limit, currency)
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

//This function gets some messages from a queue
function about(req, res, next) {
  res.json({"response" : "hello"});
}


module.exports = {
    about,
    get,
    put,
    getCodingChallange,
    closeProducerConnection,
    closeConsumerConnection
};