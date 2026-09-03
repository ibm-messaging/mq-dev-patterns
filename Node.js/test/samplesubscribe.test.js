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

const { expect } = require('chai');

// Load env.json
const ENV_FILE_KEY = 'EnvFile';
const DEFAULT_ENV_FILE = '../env.json';
const env_file = process.env[ENV_FILE_KEY] || DEFAULT_ENV_FILE;
const envConfig = require(env_file);
const MQC = mq.MQC;

// ---------------------------------------------------------------------------
// Non-durable subscribe + publish — end-to-end message delivery
// ---------------------------------------------------------------------------
describe('MQBoilerPlate SUBSCRIBE — non-durable receives published message', () => {
  it('Should receive a publication on a non-durable managed subscription', async () => {
    // Ensure DURABLE is not set for this test
    delete process.env.DURABLE;

    const i = 0;
    let receivedBuf = null;

    // 1. Create subscriber
    const subBP = new MQBoilerPlate();
    await subBP.initialise('SUBSCRIBE', false, i);

    // Subscription should be non-durable (MQSO_NON_DURABLE flag set)
    expect(subBP.isDurable).to.equal(false);

    function msgCB(md, buf) {
      receivedBuf = buf;
      return false; // stop after first message
    }

    await subBP.getMessages(null, msgCB);
    await subBP.startGetAsyncProcess();

    // 2. Publish a message
    const pubBP = new MQBoilerPlate();
    await pubBP.initialise('PUBLISH', false, i);
    const payload = { Greeting: 'subscribe test at ' + new Date() };
    await pubBP.putMessage(JSON.stringify(payload));
    await pubBP.teardown();

    // 3. Wait and verify
    await subBP.checkForTermination();
    await subBP.signalDone();
    await subBP.teardown();

    expect(receivedBuf).to.not.be.null;
    const parsed = JSON.parse(receivedBuf.toString().replace(/\0/g, '').trim());
    expect(parsed).to.have.property('Greeting');
  }).timeout(60000);
});

// ---------------------------------------------------------------------------
// DURABLE env var — verify boilerplate sets isDurable = true
// ---------------------------------------------------------------------------
describe('MQBoilerPlate SUBSCRIBE — DURABLE environment variable', () => {
  let subBP;

  afterEach(async () => {
    // Always clean up: close the durable subscription and disconnect
    if (subBP) {
      try {
        await subBP.teardown();
      } catch (e) { /* ignore teardown errors */ }
    }
    delete process.env.DURABLE;
  });

  it('Should set isDurable=true when DURABLE env var is set', async () => {
    process.env.DURABLE = '1';

    subBP = new MQBoilerPlate();
    // isDurable is determined in constructor from process.env.DURABLE
    expect(subBP.isDurable).to.equal(true);

    // initialise with durable flag — boilerplate passes MQSO_DURABLE | MQSO_RESUME
    // to the SD Options; connection should succeed without error
    await subBP.initialise('SUBSCRIBE', false, 0);
    expect(subBP.mqObj).to.not.be.null;
  }).timeout(10000);
});
