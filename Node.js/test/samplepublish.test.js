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

const MQBoilerPlate = require('../boilerplate');

const { expect } = require('chai');

// Load env.json
const ENV_FILE_KEY = 'EnvFile';
const DEFAULT_ENV_FILE = '../env.json';
const env_file = process.env[ENV_FILE_KEY] || DEFAULT_ENV_FILE;
const envConfig = require(env_file);
const envConfigLength = envConfig['MQ_ENDPOINTS'].length;

// ---------------------------------------------------------------------------
// Publish — end-to-end: initialise PUBLISH, send message, teardown.
// When no subscriber is present MQRC_NO_SUBS_MATCHED (2550) must be tolerated
// gracefully (boilerplate.isPublishNoSubscriptions handles it).
// ---------------------------------------------------------------------------
describe('MQBoilerPlate PUBLISH — no subscribers', () => {
  it('Should publish a message without throwing when no subscribers are present', async () => {
    for (let i = 0; i < envConfigLength; i++) {
      const bp = new MQBoilerPlate();
      await bp.initialise('PUBLISH', false, i);

      const msgObject = { Greeting: 'Hello from samplepublish test at ' + new Date() };
      // putMessage on a PUBLISH connection triggers MQPMO_WARN_IF_NO_SUBS_MATCHED;
      // the boilerplate absorbs the MQRC_NO_SUBS_MATCHED warning — should not reject.
      await bp.putMessage(JSON.stringify(msgObject));
      await bp.teardown();
    }
  }).timeout(10000);
});

// ---------------------------------------------------------------------------
// Publish + Subscribe — end-to-end: subscriber receives message from publisher
// ---------------------------------------------------------------------------
describe('MQBoilerPlate PUBLISH + SUBSCRIBE — message delivery', () => {
  it('Should deliver a published message to a non-durable subscriber', async () => {
    // Only test against the first endpoint to keep the test deterministic
    const i = 0;
    let receivedBuf = null;

    // 1. Open a subscription first
    const subBP = new MQBoilerPlate();
    await subBP.initialise('SUBSCRIBE', false, i);

    function msgCB(md, buf) {
      receivedBuf = buf;
      return false; // stop after one message
    }

    await subBP.getMessages(null, msgCB);
    await subBP.startGetAsyncProcess();

    // 2. Publish a message after the subscription is open
    const pubBP = new MQBoilerPlate();
    await pubBP.initialise('PUBLISH', false, i);
    const msgObject = { Greeting: 'publish-subscribe test at ' + new Date() };
    await pubBP.putMessage(JSON.stringify(msgObject));
    await pubBP.teardown();

    // 3. Wait for the subscriber to receive it
    await subBP.checkForTermination();
    await subBP.signalDone();
    await subBP.teardown();

    expect(receivedBuf).to.not.be.null;
    const parsed = JSON.parse(receivedBuf.toString().replace(/\0/g, '').trim());
    expect(parsed).to.have.property('Greeting');
  }).timeout(60000);
});
