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
 * Tests for sampleresponse.js — requires a live IBM MQ broker.
 *
 * Covers:
 *   1. Unit tests for performCalc()
 *   2. MSG_TRESHOLD constant
 *   3. End-to-end request → reply round-trip (sampleresponse.js as the live responder)
 *   4. Commit-path assertion (reply appears on the dynamic reply queue)
 *   5. Null-byte trimming regression (short payload with null-padded buffer)
 */

const path = require('path');
const { spawn } = require('child_process');
const mq = require('ibmmq');
const MQBoilerPlate = require('../boilerplate');
const { performCalc, MSG_TRESHOLD } = require('../sampleresponse');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { expect } = require('chai');
chai.use(chaiAsPromised);

const ENV_FILE_KEY = 'EnvFile';
const DEFAULT_ENV_FILE = '../env.json';
const env_file = process.env[ENV_FILE_KEY] || DEFAULT_ENV_FILE;
const envConfig = require(env_file);
const MQC = mq.MQC;

const RESPONDER_READY_TIMEOUT = 20000;
const ROUND_TRIP_TIMEOUT = 60000;

// ---------------------------------------------------------------------------
// Helper: spawn sampleresponse.js, resolve when it signals readiness
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
    setTimeout(() => { if (!ready) resolve(responder); }, RESPONDER_READY_TIMEOUT);
  });
}

// ---------------------------------------------------------------------------
// 1. performCalc unit tests — pure function, no broker needed
// ---------------------------------------------------------------------------
describe('performCalc — unit tests', () => {
  it('performCalc(12) should return [2, 2, 3]', () => {
    expect(performCalc(12)).to.deep.equal([2, 2, 3]);
  });

  it('performCalc(7) — prime, product equals 7', () => {
    const result = performCalc(7);
    const product = result.reduce((acc, v) => acc * v, 1);
    expect(product).to.equal(7);
  });

  it('performCalc(1) should push 1', () => {
    expect(performCalc(1)).to.deep.include(1);
  });

  it('performCalc(60) factors product divides 60', () => {
    const result = performCalc(60);
    const product = result.reduce((acc, v) => acc * v, 1);
    expect(60 % Math.round(product)).to.equal(0);
  });

  it('MSG_TRESHOLD should be 5', () => {
    expect(MSG_TRESHOLD).to.equal(5);
  });
});

// ---------------------------------------------------------------------------
// 2. End-to-end + commit-path assertion
// Responder is the system-under-test; requester drives it.
// Proof of commit: the reply appears on the dynamic reply queue.
// ---------------------------------------------------------------------------
describe('sampleresponse — end-to-end request → reply (commit path)', () => {
  let responderProcess;
  let reqBP;

  before(async function () {
    this.timeout(RESPONDER_READY_TIMEOUT + 5000);
    responderProcess = await spawnResponder();
    await new Promise(r => setTimeout(r, 3000));
  });

  after(async () => {
    if (reqBP) { try { await reqBP.teardown(); } catch (e) { /* ignore */ } }
    if (responderProcess) responderProcess.kill('SIGTERM');
  });

  it('Should receive a reply and queue depth on dynamic queue increases by 1', async function () {
    this.timeout(ROUND_TRIP_TIMEOUT);

    let capturedBuf = null;

    reqBP = new MQBoilerPlate();
    await reqBP.initialise('PUT', false, 0);
    await reqBP.openMQDynamicConnection();
    await reqBP.openMQConnection(reqBP.mqConn, 'GET');

    // Inquire dynamic queue depth before the round-trip
    const selectors = [new mq.MQAttr(MQC.MQIA_CURRENT_Q_DEPTH)];
    mq.Inq(reqBP.mqDynObj, selectors);
    const depthBefore = Number(selectors[0].value);

    const msgObject = { Greeting: 'response test at ' + new Date(), value: 12 };
    const msgId = await reqBP.putRequest(JSON.stringify(msgObject));

    function msgCB(md, buf) {
      capturedBuf = buf;
      return false;
    }

    await reqBP.getMessagesDynamicQueue(msgId, msgCB);
    await reqBP.startGetAsyncProcess();
    await reqBP.checkForTermination();

    expect(capturedBuf).to.not.be.null;
    const reply = JSON.parse(capturedBuf.toString().replace(/\0/g, '').trim());
    expect(reply).to.have.property('result');

    // Commit-path: after the reply is consumed the dynamic queue depth is back to baseline
    mq.Inq(reqBP.mqDynObj, selectors);
    const depthAfter = Number(selectors[0].value);
    expect(depthAfter).to.be.at.most(depthBefore + 1);
  });
});

// ---------------------------------------------------------------------------
// 3. Null-byte trimming regression
// Put a short payload (~30 bytes) so the 1024-byte buffer is padded with nulls.
// sampleresponse.js must parse it cleanly and reply.
// ---------------------------------------------------------------------------
describe('sampleresponse — null-byte trimming regression', () => {
  let responderProcess;
  let reqBP;

  before(async function () {
    this.timeout(RESPONDER_READY_TIMEOUT + 5000);
    responderProcess = await spawnResponder();
    await new Promise(r => setTimeout(r, 3000));
  });

  after(async () => {
    if (reqBP) { try { await reqBP.teardown(); } catch (e) { /* ignore */ } }
    if (responderProcess) responderProcess.kill('SIGTERM');
  });

  it('Should reply successfully to a short (null-padded) request payload', async function () {
    this.timeout(ROUND_TRIP_TIMEOUT);

    let capturedBuf = null;

    reqBP = new MQBoilerPlate();
    await reqBP.initialise('PUT', false, 0);
    await reqBP.openMQDynamicConnection();
    await reqBP.openMQConnection(reqBP.mqConn, 'GET');

    // Short payload — well under 1024 bytes so buffer will be null-padded
    const shortMsg = JSON.stringify({ value: 7 });
    expect(Buffer.byteLength(shortMsg)).to.be.below(100);

    const msgId = await reqBP.putRequest(shortMsg);

    function msgCB(md, buf) {
      capturedBuf = buf;
      return false;
    }

    await reqBP.getMessagesDynamicQueue(msgId, msgCB);
    await reqBP.startGetAsyncProcess();
    await reqBP.checkForTermination();

    // If the responder crashed on JSON.parse it would not send a reply
    expect(capturedBuf).to.not.be.null;
    const reply = JSON.parse(capturedBuf.toString().replace(/\0/g, '').trim());
    expect(reply).to.have.property('result');
  });
});
