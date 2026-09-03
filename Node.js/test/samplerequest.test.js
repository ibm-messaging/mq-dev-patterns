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

/**
 * End-to-end tests for samplerequest.js — requires a live IBM MQ broker.
 *
 * Strategy:
 *   1. Spawn sampleresponse.js as a background child process (the live responder).
 *   2. Wait until its stdout/stderr emits a readiness signal.
 *   3. Drive the requester side directly via MQBoilerPlate:
 *        initialise('PUT') → openMQDynamicConnection()
 *        → putRequest() → getMessagesDynamicQueue()
 *        → startGetAsyncProcess() → checkForTermination()
 *   4. Assert the captured reply body is valid JSON containing a 'result' field.
 *   5. Kill the responder process in after().
 */

const path = require('path');
const { spawn } = require('child_process');
const MQBoilerPlate = require('../boilerplate');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { expect } = require('chai');
chai.use(chaiAsPromised);

// How long to wait for the responder to signal readiness (ms)
const RESPONDER_READY_TIMEOUT = 20000;
// How long the full request-response round-trip may take (ms)
const ROUND_TRIP_TIMEOUT = 60000;

// ---------------------------------------------------------------------------
// Helper: spawn sampleresponse.js and wait until it logs a readiness signal
// ---------------------------------------------------------------------------
function spawnResponder() {
  return new Promise((resolve, reject) => {
    const responder = spawn('node', [path.join(__dirname, '..', 'sampleresponse.js')], {
      env: Object.assign({}, process.env, { DEBUG: '' }),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let ready = false;

    const onData = (data) => {
      const text = data.toString();
      if (!ready && (text.includes('MQ Connection') || text.includes('established') || text.includes('Getting Messages'))) {
        ready = true;
        resolve(responder);
      }
    };

    responder.stdout.on('data', onData);
    responder.stderr.on('data', onData);
    responder.on('error', reject);

    setTimeout(() => {
      if (!ready) {
        // Resolve anyway — the responder may have connected silently
        resolve(responder);
      }
    }, RESPONDER_READY_TIMEOUT);
  });
}

// ---------------------------------------------------------------------------
// End-to-end: requester sends MQMT_REQUEST, responder replies
// ---------------------------------------------------------------------------
describe('samplerequest — end-to-end request / response round-trip', () => {
  let responderProcess;
  let reqBP;

  before(async function () {
    this.timeout(RESPONDER_READY_TIMEOUT + 5000);
    responderProcess = await spawnResponder();
    // Give the responder a moment to fully open its queue after signalling ready
    await new Promise(r => setTimeout(r, 3000));
  });

  after(async () => {
    if (reqBP) {
      try { await reqBP.teardown(); } catch (e) { /* ignore */ }
    }
    if (responderProcess) {
      responderProcess.kill('SIGTERM');
    }
  });

  it('Should receive a correlated reply with a result field', async function () {
    this.timeout(ROUND_TRIP_TIMEOUT);

    let capturedBuf = null;

    reqBP = new MQBoilerPlate();

    await reqBP.initialise('PUT', false, 0);
    await reqBP.openMQDynamicConnection();

    const msgObject = {
      Greeting: 'Hello from samplerequest test at ' + new Date(),
      value: Math.floor(Math.random() * 100)
    };
    const msgId = await reqBP.putRequest(JSON.stringify(msgObject));

    function msgCB(md, buf) {
      capturedBuf = buf;
      return false; // stop after one reply
    }

    await reqBP.getMessagesDynamicQueue(msgId, msgCB);
    await reqBP.startGetAsyncProcess();
    await reqBP.checkForTermination();

    expect(capturedBuf).to.not.be.null;
    const reply = JSON.parse(capturedBuf.toString().replace(/\0/g, '').trim());
    expect(reply).to.have.property('result');
  });
});
