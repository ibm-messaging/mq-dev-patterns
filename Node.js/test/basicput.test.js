/**
 * Copyright 2025 IBM Corp.
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

const { toHexString, getConnection, putMessage, ccdtCheck } = require('../basicput');
const { buildMQDetails,initialise,connx } = require('../basicget');
const mq = require('ibmmq');

// Load up missing envrionment variables from the env.json file
const ENV_FILE_KEY = "EnvFile"
const DEFAULT_ENV_FILE = "../env.json";
const env_file = process.env[ENV_FILE_KEY] || DEFAULT_ENV_FILE;
const envConfig = require(env_file);

const { assert, expect } = require('chai');
const envConfigLength = envConfig['MQ_ENDPOINTS'].length;
const MQC = mq.MQC;

describe('toHexString function', () => {
    let msgId;
    let returnValue;
    let re;
    beforeEach(() => {
        msgId = new Uint8Array([65, 77, 81, 32, 81, 77, 49, 32, 32, 32, 32, 32, 32, 32, 32, 32, 190, 196, 30, 102, 1, 144, 5, 64]);
        re = /[0-9A-Fa-f]{6}/g;
    })

    it('Should convert a Buffer to a Hex String', () => {
        for (let i = 0; i < envConfigLength; i++) {
            returnValue = toHexString(msgId);
            expect(returnValue).to.equal('414d5120514d31202020202020202020bec41e6601900540');
            expect(returnValue.length).to.equal(48);
            expect(re.test(returnValue)).to.equal(true);
        }
    })
})

describe('getConnection function', () => {
    let returnValue;
    let returns;
    let HOSTS;
    let PORTS;

    beforeEach(() => {
        HOSTS = [];
        PORTS = [];
        for (let i = 0; i < envConfigLength; i++) {
            HOSTS.push(envConfig['MQ_ENDPOINTS'][i]['HOST']);
            PORTS.push(envConfig['MQ_ENDPOINTS'][i]['PORT']);
        }
    })

    it('Should return an array with all the HOST and PORT values in the env.json', () => {
        returnValue = getConnection();
        returns = returnValue.split(',');
        for (let i = 0; i < returns.length; i++) {
            expect(returns[i]).to.equal(`${HOSTS[i]}(${PORTS[i]})`);
        }
    })
})

describe('putMessage function', () => {
    let cno;
    let MQDetails;
    let credentials;
    let od;
    let openOptions;
    let selectors;
    let qDepths;

    beforeEach(() => {
        MQDetails = {};
        credentials = {};
        qDepths = [];
        cno = new mq.MQCNO();
        od = new mq.MQOD();
        openOptions = MQC.MQOO_OUTPUT | MQC.MQOO_INQUIRE;
    });

    it('Should perform MQPUT', async () => {
        for (let i = 0; i < envConfigLength; i++) {
            await buildMQDetails(MQDetails, credentials, i);
            await initialise(cno, MQDetails, credentials);
            result = await connx(cno, MQDetails);
            od.ObjectName = MQDetails.QUEUE_NAME;
            od.ObjectQMgrName = MQDetails.QMGR;
            od.ObjectType = MQC.MQOT_Q;
            selectors = [new mq.MQAttr(MQC.MQIA_CURRENT_Q_DEPTH)];
            mq.Open(result, od, openOptions, async function (err, hObj) {
                if (err) {
                    console.warn("Error Opening for Put : ", err);
                } else {
                    mq.Inq(hObj,selectors);
                    qDepths.push(selectors[0].value);
                    putMessage(hObj);
                    mq.Inq(hObj,selectors);
                    qDepths.push(selectors[0].value);
                }
                expect(Number(qDepths[1])).to.equal(Number(qDepths[0])+1)
            })
        }
    }).timeout(5000);
})