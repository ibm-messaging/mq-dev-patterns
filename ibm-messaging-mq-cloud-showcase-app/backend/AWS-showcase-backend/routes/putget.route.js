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

const express = require('express');
const router = express.Router();
const putgetController = require('../controllers/putget/putget.controller');
const pubsubController = require('../controllers/pubsub/pubsub.controller');
const utilsController = require('../controllers/utils/utils.controller');
const reuqestreponseController = require('../controllers/requestresponse/requestresponse.controller');

router.get('/api/mqget', putgetController.get);
router.post('/api/mqput', putgetController.put);
router.get('/api/closeProducer', putgetController.closeProducerConnection);
router.get('/api/closeConsumer', putgetController.closeConsumerConnection);
router.get('/api/getCodingChallange', putgetController.getCodingChallange)
router.get('/api/qdepth', utilsController.get);
router.post('/api/sub', pubsubController.sub);
router.post('/api/pub', pubsubController.pub);
router.post('/api/getLastMessage', pubsubController.getLastSubMessage);
router.get('/api/unsub', pubsubController.unsub);
router.post('/api/putReq', reuqestreponseController.putReq);
router.get('/api/getRes', reuqestreponseController.getRes);

router.get('/', putgetController.about);


module.exports = router;