/**
 * Copyright 2025, 2026 IBM Corp.
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
const mq = require('ibmmq');

// Load up missing environment variables from the env.json file
const ENV_FILE_KEY = "EnvFile";
const DEFAULT_ENV_FILE = "../env.json";
const env_file = process.env[ENV_FILE_KEY] || DEFAULT_ENV_FILE;
const envConfig = require(env_file);

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { assert, expect } = require('chai');

chai.use(chaiAsPromised);

const envConfigLength = envConfig['MQ_ENDPOINTS'].length;
const MQC = mq.MQC;

describe('MQBoilerPlate.toHexString static method', () => {
    let msgId;
    let re;

    beforeEach(() => {
        msgId = new Uint8Array([65, 77, 81, 32, 81, 77, 49, 32, 32, 32, 32, 32, 32, 32, 32, 32, 190, 196, 30, 102, 1, 144, 5, 64]);
        re = /[0-9A-Fa-f]{6}/g;
    });

    it('Should convert a Buffer to a Hex String', () => {
        const returnValue = MQBoilerPlate.toHexString(msgId);
        expect(returnValue).to.equal('414d5120514d31202020202020202020bec41e6601900540');
        expect(returnValue.length).to.equal(48);
        expect(re.test(returnValue)).to.equal(true);
    });
});

describe('MQBoilerPlate.hexToBytes static method', () => {
    it('Should convert a Hex String back to a byte array', () => {
        const hex = '414d5120514d31202020202020202020bec41e6601900540';
        const bytes = MQBoilerPlate.hexToBytes(hex);
        expect(bytes).to.be.an('array');
        expect(bytes.length).to.equal(24);
        expect(bytes[0]).to.equal(0x41);
        expect(bytes[1]).to.equal(0x4d);
    });
});

describe('MQBoilerPlate getConnection method', () => {
    let mqBoilerPlate;
    let HOSTS;
    let PORTS;

    beforeEach(() => {
        mqBoilerPlate = new MQBoilerPlate();
        HOSTS = [];
        PORTS = [];
        for (let i = 0; i < envConfigLength; i++) {
            HOSTS.push(envConfig['MQ_ENDPOINTS'][i]['HOST']);
            PORTS.push(envConfig['MQ_ENDPOINTS'][i]['PORT']);
        }
    });

    it('Should return a connection string with all HOST and PORT values from env.json', () => {
        const returnValue = mqBoilerPlate.getConnection();
        const parts = returnValue.split(',');
        for (let i = 0; i < parts.length; i++) {
            expect(parts[i]).to.equal(`${HOSTS[i]}(${PORTS[i]})`);
        }
    });
});

describe('MQBoilerPlate initialise method (PUT)', () => {
    let mqBoilerPlate;

    beforeEach(() => {
        mqBoilerPlate = new MQBoilerPlate();
    });

    afterEach(() => {
        return mqBoilerPlate.teardown();
    });

    it('Should establish an MQ connection and open the queue for PUT', async () => {
        await assert.isFulfilled(mqBoilerPlate.initialise('PUT'));
        expect(mqBoilerPlate.mqConn).to.exist;
        expect(mqBoilerPlate.mqObj).to.exist;
    }).timeout(10000);
});

describe('MQBoilerPlate putMessage method', () => {
    let mqBoilerPlate;
    let selectors;
    let qDepthBefore;
    let qDepthAfter;

    beforeEach(async () => {
        mqBoilerPlate = new MQBoilerPlate();
        await mqBoilerPlate.initialise('PUT');
        selectors = [new mq.MQAttr(MQC.MQIA_CURRENT_Q_DEPTH)];
    });

    afterEach(() => {
        return mqBoilerPlate.teardown();
    });

    it('Should perform MQPUT, increasing queue depth by 1', (done) => {
        const openOptions = MQC.MQOO_OUTPUT | MQC.MQOO_INQUIRE;
        const od = new mq.MQOD();
        od.ObjectName = mqBoilerPlate.MQDetails.QUEUE_NAME;
        od.ObjectType = MQC.MQOT_Q;

        mq.Open(mqBoilerPlate.mqConn, od, openOptions, async function (err, hObj) {
            if (err) {
                done(err);
                return;
            }
            mq.Inq(hObj, selectors);
            qDepthBefore = selectors[0].value;

            const msgObject = { 'Greeting': "Hello from Node at " + new Date() };
            await mqBoilerPlate.putMessage(JSON.stringify(msgObject));

            mq.Inq(hObj, selectors);
            qDepthAfter = selectors[0].value;

            expect(Number(qDepthAfter)).to.equal(Number(qDepthBefore) + 1);
            mq.Close(hObj, 0, () => done());
        });
    }).timeout(10000);

    it('Should return a hex string MsgId after MQPUT', async () => {
        const msgObject = { 'Greeting': "Hello from Node at " + new Date() };
        const msgId = await mqBoilerPlate.putMessage(JSON.stringify(msgObject));
        expect(msgId).to.be.a('string');
        expect(msgId.length).to.equal(48);
        expect(/^[0-9a-f]+$/.test(msgId)).to.equal(true);
    }).timeout(10000);
});
