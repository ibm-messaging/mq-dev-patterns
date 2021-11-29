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

const express = require('express');
const router = express.Router();

const MQClient = require('../mqclient/mqclient');
let mqclient = new MQClient();

// Set Logging options
let debug_info = require('debug')('mqapp-approutes:info');
let debug_warn = require('debug')('mqapp-approutes:warn');

const APPTITLE = 'MQ apps on CodeEngine';
const DEFAULT_LIMIT = 10;

// GET home page
router.get('/', (req, res, next) => {
  debug_info('Routing to /')
  res.render('index', {
    title: APPTITLE
  });
});


// Put page, containing form for messages to send
router.get('/mqput', (req, res, next) => {
  debug_info('Routing to /mqput');
  res.render('mqput', {status: ''});
});


// Get page, containing form for numbrer of messages to get
router.get('/mqget', (req, res, next) => {
  debug_info('Routing to /mqget');
  res.render('mqget', {status: ''});
});


// PUT API expects input containing message and
// quantity.
router.post('/api/mqput', (req, res, next) => {
  debug_info('Routing to /api/mqput');

  let data = req.body;
  debug_info('MQ Put Request submitted for ', data);

  let putRequest = {
    message : 'Message app running in Cloud Engine',
    quantity : 1
  }
  if (data.message) {
    putRequest.message = data.message;
  }
  if (data.quantity) {
    putRequest.quantity = data.quantity;
    if (putRequest.quantity < 0) {
      debug_info('negating the negative quantity provided!');
      putRequest.quantity *= -1;
    } else if (putRequest.quantity === 0) {
      putRequest.quantity = 1;
    }
  }

  debug_info("Attempting MQ Put for ", putRequest);

  mqclient.put(putRequest)
  .then((statusMsg) => {
    res.json({
      status: statusMsg
    });
  })
  .catch((err) => {
    debug_warn("Put has failed with error : ", err);
    res.status(500).send({
      error: err
    });
  });

});


// GET API expects query input for number of messages to get
router.get('/api/mqget', function(req, res, next) {
  debug_info('Routing to /api/mqget');

  let querydata = req.query;
  debug_info('MQ Get Request submitted for ', querydata);

  let getLimit = DEFAULT_LIMIT;
  if (querydata && querydata.limit && !isNaN(querydata.limit)) {
    getLimit = querydata.limit;
  }

  mqclient.get(getLimit)
  .then((data) => {
    res.json(data);
  })
  .catch((err) => {
    res.status(500).send({
      error: err
    });
  });
});

// Getbyid API expects msgid as a query input. The api
// will attempt to get a message with the specified id.
router.get('/api/mqgetbyid', function(req, res, next) {
  debug_info('Routing to /api/mqgetbyid');

  let querydata = req.query;
  debug_info('MQ Get by id request submitted for ', querydata);

  let msgid = null;
  if (querydata && querydata.msgid) {
    msgid = querydata.msgid;
    res.json({
      status: 'Request was received'
    });
    // No need to tell requester about subsequent processing
    mqclient.getById(msgid)
    .then((data) => {
      debug_info('Message data obtained ready to process ...');
    })
    .catch((err) => {
      debug_info('Unable to obtain message');
    })
  } else {
    res.status(500).send({
      error: 'request was missing msgid'
    });
  }

});


function catchDeathSignal() {
  debug_info('Application is about to die, processing tidy-up');
  mqclient.performCleanUp()
  .then(() => {
    debug_info('Cleanup completed sucessfully');
    process.exit(0);
  })
  .catch((err) => {
    debug_warn('Cleanup failed! ', err);
    process.exit(0);
  })

}

process.on('SIGTERM', catchDeathSignal);
process.on('SIGINT', catchDeathSignal);
process.on('SIGHUP', catchDeathSignal);


module.exports = router;
