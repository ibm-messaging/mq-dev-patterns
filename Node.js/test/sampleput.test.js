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

// Load env.json
const ENV_FILE_KEY = 'EnvFile';
const DEFAULT_ENV_FILE = '../env.json';
const env_file = process.env[ENV_FILE_KEY] || DEFAULT_ENV_FILE;
const envConfig = require(env_file);

const { expect } = require('chai');
const envConfigLength = envConfig['MQ_ENDPOINTS'].length;
const MQC = mq.MQC;

// ---------------------------------------------------------------------------
// toHexString — static utility on MQBoilerPlate
// ---------------------------------------------------------------------------
describe('MQBoilerPlate.toHexString', () => {
  let msgId;
  let re;

  beforeEach(() => {
    msgId = new Uint8Array([65, 77, 81, 32, 81, 77, 49, 32, 32, 32, 32, 32, 32, 32, 32, 32,
                            190, 196, 30, 102, 1, 144, 5, 64]);
    re = /[0-9A-Fa-f]{6}/g;
  });

  it('Should convert a Buffer to a hex string', () => {
    const returnValue = MQBoilerPlate.toHexString(msgId);
    expect(returnValue).to.equal('414d5120514d31202020202020202020bec41e6601900540');
    expect(returnValue.length).to.equal(48);
    expect(re.test(returnValue)).to.equal(true);
  });
});

// ---------------------------------------------------------------------------
// getConnection — instance method that reads all endpoints from env.json
// ---------------------------------------------------------------------------
describe('MQBoilerPlate#getConnection', () => {
  it('Should return host(port) pairs for all MQ_ENDPOINTS in env.json', () => {
    const bp = new MQBoilerPlate();
    const returnValue = bp.getConnection();
    const parts = returnValue.split(',');

    expect(parts.length).to.equal(envConfigLength);
    for (let i = 0; i < envConfigLength; i++) {
      const host = envConfig.MQ_ENDPOINTS[i].HOST;
      const port = envConfig.MQ_ENDPOINTS[i].PORT;
      expect(parts[i]).to.equal(`${host}(${port})`);
    }
  });
});

// ---------------------------------------------------------------------------
// ccdtCheck — static utility
// ---------------------------------------------------------------------------
describe('MQBoilerPlate.ccdtCheck', () => {
  it('Should return true if MQCCDTURL is in env and file exists, else false', () => {
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
// putMessage — integration test: initialise PUT, send one message, teardown.
// Checks queue depth increases by 1.
// ---------------------------------------------------------------------------
describe('MQBoilerPlate putMessage integration', () => {
  it('Should perform MQPUT and increase queue depth by 1', async () => {
    for (let i = 0; i < envConfigLength; i++) {
      const bp = new MQBoilerPlate();
      await bp.initialise('PUT', false, i);

      // Inquire depth before
      const od = new mq.MQOD();
      od.ObjectName = envConfig.MQ_ENDPOINTS[i].QUEUE_NAME;
      od.ObjectQMgrName = envConfig.MQ_ENDPOINTS[i].QMGR;
      od.ObjectType = MQC.MQOT_Q;
      const openOptions = MQC.MQOO_OUTPUT | MQC.MQOO_INQUIRE;
      const selectors = [new mq.MQAttr(MQC.MQIA_CURRENT_Q_DEPTH)];

      await new Promise((resolve, reject) => {
        mq.Open(bp.mqConn, od, openOptions, (err, hInq) => {
          if (err) return reject(err);
          mq.Inq(hInq, selectors);
          const depthBefore = selectors[0].value;

          const msgObject = { Greeting: 'Hello from sampleput test at ' + new Date() };
          bp.putMessage(JSON.stringify(msgObject))
            .then(() => {
              mq.Inq(hInq, selectors);
              const depthAfter = selectors[0].value;
              expect(Number(depthAfter)).to.equal(Number(depthBefore) + 1);
              mq.Close(hInq, 0, () => resolve());
            })
            .catch(reject);
        });
      });

      await bp.teardown();
    }
  }).timeout(10000);
});

// ---------------------------------------------------------------------------
// multi-endpoint: verify getConnection iterates all endpoints
// ---------------------------------------------------------------------------
describe('Multi-endpoint connection string', () => {
  it('Should include all endpoints when MQ_ENDPOINTS has multiple entries', () => {
    const bp = new MQBoilerPlate();
    const conn = bp.getConnection();
    // Each endpoint must appear as host(port) in the connection string
    envConfig.MQ_ENDPOINTS.forEach((ep) => {
      if (ep.HOST && ep.PORT) {
        expect(conn).to.include(`${ep.HOST}(${ep.PORT})`);
      }
    });
  });
});
