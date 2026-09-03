/**
 * Copyright 2026 IBM Corp.
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

const mq = require('ibmmq');
const MQBoilerPlate = require('../boilerplate');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { assert, expect } = require('chai');
chai.use(chaiAsPromised);

// Load env.json
const ENV_FILE_KEY = 'EnvFile';
const DEFAULT_ENV_FILE = '../env.json';
const env_file = process.env[ENV_FILE_KEY] || DEFAULT_ENV_FILE;
const envConfig = require(env_file);

const envConfigLength = envConfig['MQ_ENDPOINTS'].length;
const MQC = mq.MQC;

// ---------------------------------------------------------------------------
// ccdtCheck — static utility (was in basicget.test.js)
// ---------------------------------------------------------------------------
describe('MQBoilerPlate.ccdtCheck (get context)', () => {
  it('Should return true if MQCCDTURL in env and file exists, else false', () => {
    const flag = MQBoilerPlate.ccdtCheck();
    const CCDT = 'MQCCDTURL';
    if (CCDT in process.env) {
      expect(flag).to.equal(true);
    } else {
      expect(flag).to.equal(false);
    }
  });
});

// ---------------------------------------------------------------------------
// buildMQDetails equivalent — after initialise('GET') MQDetails is populated
// ---------------------------------------------------------------------------
describe('MQBoilerPlate buildMQDetails (via initialise)', () => {
  it('Should populate MQDetails with all required connection keys', async () => {
    for (let i = 0; i < envConfigLength; i++) {
      const bp = new MQBoilerPlate();
      await bp.initialise('GET', false, i);

      const ep = envConfig.MQ_ENDPOINTS[i];
      expect(bp.MQDetails.QMGR).to.equal(ep.QMGR);
      expect(bp.MQDetails.QUEUE_NAME).to.equal(ep.QUEUE_NAME);
      expect(bp.MQDetails.HOST).to.equal(ep.HOST);
      expect(bp.MQDetails.PORT).to.equal(ep.PORT);
      expect(bp.MQDetails.CHANNEL).to.equal(ep.CHANNEL);
      expect(bp.credentials.USER).to.equal(ep.APP_USER);
      expect(bp.credentials.PASSWORD).to.equal(ep.APP_PASSWORD);

      await bp.teardown();
    }
  }).timeout(10000);
});

// ---------------------------------------------------------------------------
// Lifecycle integration — initialise → connection open → close → disconnect
// Replaces the discrete connx / open / close / disconnect unit tests from
// basicget.test.js, since these are all internal to boilerplate.initialise().
// ---------------------------------------------------------------------------
describe('MQBoilerPlate GET lifecycle (connect → open → close → disconnect)', () => {
  it('Should connect, open queue, then cleanly teardown', async () => {
    for (let i = 0; i < envConfigLength; i++) {
      const bp = new MQBoilerPlate();

      // initialise() internally calls connectToMQ + openMQConnection
      await bp.initialise('GET', false, i);

      // After initialise: connection and queue handle must be set
      expect(bp.mqConn).to.not.be.null;
      expect(bp.mqObj).to.not.be.null;

      // The queue handle should refer to the configured queue name
      expect(bp.mqObj._name).to.equal(envConfig.MQ_ENDPOINTS[i].QUEUE_NAME);

      // teardown() calls closeMQConnection + disconnectFromMQ — assert promise resolves
      await assert.isFulfilled(bp.teardown());
    }
  }).timeout(10000);
});

// ---------------------------------------------------------------------------
// getMessage — pre-populate queue with sampleput, then retrieve via async CB
// Replaces the getMessage test from basicget.test.js.
// ---------------------------------------------------------------------------
describe('MQBoilerPlate getMessage (async callback)', () => {
  it('Should receive a message via async callback after a put', async () => {
    for (let i = 0; i < envConfigLength; i++) {
      // First put a message using a PUT boilerplate instance
      const putBP = new MQBoilerPlate();
      await putBP.initialise('PUT', false, i);
      await putBP.putMessage(JSON.stringify({ Greeting: 'test message for get at ' + new Date() }));
      await putBP.teardown();

      // Now get that message via async callback
      let receivedBuf = null;
      const getBP = new MQBoilerPlate();

      function msgCB(md, buf) {
        receivedBuf = buf;
        // Return false to stop listening after one message
        return false;
      }

      await getBP.initialise('GET', false, i);
      await getBP.getMessages(null, msgCB);
      await getBP.startGetAsyncProcess();
      await getBP.checkForTermination();
      await getBP.signalDone();
      await getBP.teardown();

      // The callback should have been invoked with message content
      expect(receivedBuf).to.not.be.null;
    }
  }).timeout(60000);
});
