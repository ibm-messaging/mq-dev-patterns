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
const mq = require('ibmmq');
const exec = require('child_process').exec;

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

describe('MQBoilerPlate.ccdtCheck static method', () => {
    it('Should return true if MQCCDTURL env var is set and the file exists, else false', () => {
        const flag = MQBoilerPlate.ccdtCheck();
        const CCDT = "MQCCDTURL";
        if (CCDT in process.env) {
            expect(flag).to.equal(true);
        } else {
            expect(flag).to.equal(false);
        }
    });
});

describe('MQBoilerPlate buildMQDetails method', () => {
    let mqBoilerPlate;

    beforeEach(() => {
        mqBoilerPlate = new MQBoilerPlate();
    });

    it('Should populate MQDetails and credentials correctly for each endpoint', async () => {
        for (let i = 0; i < envConfigLength; i++) {
            mqBoilerPlate.index = i;
            await mqBoilerPlate.buildMQDetails();
            expect(mqBoilerPlate.MQDetails.QMGR).to.equal(envConfig.MQ_ENDPOINTS[i].QMGR);
            expect(mqBoilerPlate.MQDetails.QUEUE_NAME).to.equal(envConfig.MQ_ENDPOINTS[i].QUEUE_NAME);
            expect(mqBoilerPlate.MQDetails.HOST).to.equal(envConfig.MQ_ENDPOINTS[i].HOST);
            expect(mqBoilerPlate.MQDetails.PORT).to.equal(envConfig.MQ_ENDPOINTS[i].PORT);
            expect(mqBoilerPlate.MQDetails.CHANNEL).to.equal(envConfig.MQ_ENDPOINTS[i].CHANNEL);
            expect(mqBoilerPlate.credentials.USER).to.equal(envConfig.MQ_ENDPOINTS[i].APP_USER);
            expect(mqBoilerPlate.credentials.PASSWORD).to.equal(envConfig.MQ_ENDPOINTS[i].APP_PASSWORD);
        }
    });
});

describe('MQBoilerPlate buildMQCNO method', () => {
    let mqBoilerPlate;

    beforeEach(async () => {
        mqBoilerPlate = new MQBoilerPlate();
        mqBoilerPlate.index = 0;
        mqBoilerPlate.modeType = 'GET';
        await mqBoilerPlate.buildMQDetails();
    });

    it('Should build a MQCNO with CLIENT_BINDING option set', async () => {
        const mqcno = await mqBoilerPlate.buildMQCNO();
        expect(mqcno).to.exist;
        expect(mqcno.Options & MQC.MQCNO_CLIENT_BINDING).to.equal(MQC.MQCNO_CLIENT_BINDING);
    });

    it('Should set SecurityParms when credentials are provided', async () => {
        const mqcno = await mqBoilerPlate.buildMQCNO();
        if (mqBoilerPlate.credentials.USER) {
            expect(mqcno.SecurityParms).to.exist;
            expect(mqcno.SecurityParms.UserId).to.equal(envConfig.MQ_ENDPOINTS[0].APP_USER);
        }
    });

    it('Should set ClientConn with correct ChannelName and ConnectionName when CCDT is not used', async () => {
        const mqcno = await mqBoilerPlate.buildMQCNO();
        if (!MQBoilerPlate.ccdtCheck()) {
            expect(mqcno.ClientConn).to.exist;
            expect(mqcno.ClientConn.ChannelName).to.equal(envConfig.MQ_ENDPOINTS[0].CHANNEL);
            expect(mqcno.ClientConn.ConnectionName).to.equal(
                `${envConfig.MQ_ENDPOINTS[0].HOST}(${envConfig.MQ_ENDPOINTS[0].PORT})`
            );
        }
    });
});

describe('MQBoilerPlate initialise method (GET)', () => {
    let mqBoilerPlate;

    beforeEach(() => {
        mqBoilerPlate = new MQBoilerPlate();
    });

    afterEach(() => {
        return mqBoilerPlate.teardown();
    });

    it('Should establish an MQ connection and open the queue for GET', async () => {
        for (let i = 0; i < envConfigLength; i++) {
            await assert.isFulfilled(mqBoilerPlate.initialise('GET', false, i));
            expect(mqBoilerPlate.mqConn).to.exist;
            expect(mqBoilerPlate.mqObj).to.exist;
        }
    }).timeout(3000);
});

describe('MQBoilerPlate getMessages method', () => {
    let mqBoilerPlate;

    beforeEach(() => {
        mqBoilerPlate = new MQBoilerPlate();
    });

    afterEach(async () => {
        // Stop the async MQ callback event loop before teardown, otherwise the
        // mq.Ctl(MQOP_START) dispatcher keeps the Node.js event loop alive and
        // mocha never exits. Guard against mqConn being null (e.g. if initialise
        // was never called or already torn down) so the Ctl call does not throw
        // and silently leave the dispatcher running.
        if (mqBoilerPlate.mqConn) {
            await new Promise((resolve) => {
                mq.Ctl(mqBoilerPlate.mqConn, MQC.MQOP_STOP, () => resolve());
            });
        }
        return mqBoilerPlate.teardown();
    });

    it('Should drain messages from the queue after a sampleput', async () => {
        // Use sampleput.js to place a message on the queue so there is something to retrieve
        await new Promise((resolve, reject) => {
            exec('node sampleput.js', (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        await mqBoilerPlate.initialise('GET', true, 0);

        let messagesReceived = 0;
        function msgCB(md, buf) {
            messagesReceived++;
            // Return false so the callback does not keep listening indefinitely
            return false;
        }

        await mqBoilerPlate.getMessages(null, msgCB);
        await mqBoilerPlate.startGetAsyncProcess();

        // Allow a brief interval for the async get callback to fire
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // await mqBoilerPlate.signalDone();

        expect(messagesReceived).to.be.at.least(1);
    }).timeout(15000);


describe('MQBoilerPlate teardown method', () => {
    let mqBoilerPlate;

    beforeEach(() => {
        mqBoilerPlate = new MQBoilerPlate();
    });

    it('Should close queue and disconnect from MQ cleanly after GET initialise', async () => {
        for (let i = 0; i < envConfigLength; i++) {
            await mqBoilerPlate.initialise('GET', false, i);
            await assert.isFulfilled(mqBoilerPlate.teardown());
            expect(mqBoilerPlate.mqConn).to.equal(null);
            expect(mqBoilerPlate.mqObj).to.equal(null);
        }
    }).timeout(3000);
});


});

