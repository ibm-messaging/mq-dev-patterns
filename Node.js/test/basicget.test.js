const { buildMQDetails, ccdtCheck, initialise, connx, open, close, disconnect, getMessage } = require('../basicget');
const mq = require('ibmmq');
const exec = require('child_process').exec;

// Load up missing envrionment variables from the env.json file
const ENV_FILE_KEY = "EnvFile"
const DEFAULT_ENV_FILE = "../env.json";
const env_file = process.env[ENV_FILE_KEY] || DEFAULT_ENV_FILE;
const envConfig = require(env_file);

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised'); // Assertion library of Chai which handles testing of Promise related functions
const { assert, expect } = require('chai');

chai.use(chaiAsPromised);
const envConfigLength = envConfig['MQ_ENDPOINTS'].length;
const MQC = mq.MQC;

describe('buildMQDetails function', () => {
    let MQDetails;
    let credentials;

    beforeEach(() => {
        MQDetails = {};
        credentials = {};
    });

    it('Should populate MQDetails and credentials correctly', async () => {
        for (let i = 0; i < envConfigLength; i++) {
            await buildMQDetails(MQDetails, credentials, i);
            expect(MQDetails).to.deep.equal({
                QMGR: envConfig.MQ_ENDPOINTS[i].QMGR,
                QUEUE_NAME: envConfig.MQ_ENDPOINTS[i].QUEUE_NAME,
                HOST: envConfig.MQ_ENDPOINTS[i].HOST,
                PORT: envConfig.MQ_ENDPOINTS[i].PORT,
                CHANNEL: envConfig.MQ_ENDPOINTS[i].CHANNEL,
                KEY_REPOSITORY: envConfig.MQ_ENDPOINTS[i].KEY_REPOSITORY,
                CIPHER: envConfig.MQ_ENDPOINTS[i].CIPHER
            });

            expect(credentials).to.deep.equal({
                USER: envConfig.MQ_ENDPOINTS[i].APP_USER,
                PASSWORD: envConfig.MQ_ENDPOINTS[i].APP_PASSWORD
            })
        }
    });
});

describe('ccdtCheck function', () => {
    let flag;
    let CCDT;

    it('Should return true if CCDT found in env, else false', () => {
        flag = ccdtCheck();
        CCDT = "MQCCDTURL";
        if (CCDT in process.env) {
            expect(flag).to.equal(true);
        } else {
            expect(flag).to.equal(false);
        }
    });
});

describe('initialise function', () => {
    let cno;
    let MQDetails;
    let credentials;

    beforeEach(() => {
        cno = {};
        MQDetails = {};
        credentials = {};
    });

    it('Should set SecurityParms in CNO when credentials are provided', async () => {
        for (let i = 0; i < envConfigLength; i++) {
            await buildMQDetails(MQDetails, credentials, i);
            await initialise(cno, MQDetails, credentials);
            expect(cno.SecurityParms.UserId).to.equal(envConfig.MQ_ENDPOINTS[i].APP_USER);
            expect(cno.SecurityParms.Password).to.equal(envConfig.MQ_ENDPOINTS[i].APP_PASSWORD);
            expect(cno.ClientConn).to.exist;
            expect(cno.ClientConn.ChannelName).to.equal(envConfig.MQ_ENDPOINTS[i].CHANNEL);
            expect(cno.ClientConn.ConnectionName).to.equal(`${envConfig.MQ_ENDPOINTS[i].HOST}(${envConfig.MQ_ENDPOINTS[i].PORT})`);
            if (MQDetails.KEY_REPOSITORY) {
                expect(cno.ClientConn.SSLCipherSpec).to.equal(envConfig.MQ_ENDPOINTS[i].CIPHER_SUITE);
                expect(cno.SSLConfig).to.exist;
                expect(cno.SSLConfig.KeyRepository).to.equal(envConfig.MQ_ENDPOINTS[i].KEY_REPOSITORY);
            }
        }
    });
});

describe('connx function', () => {
    let cno;
    let MQDetails;
    let credentials;

    beforeEach(() => {
        MQDetails = {};
        credentials = {};
        cno = new mq.MQCNO();
    });

    it('Should perform MQCONN', async () => {
        for (let i = 0; i < envConfigLength; i++) {
            await buildMQDetails(MQDetails, credentials, i);
            await initialise(cno, MQDetails, credentials);
            try {
                return assert.isFulfilled(connx(cno, MQDetails));
            } catch (err) {
                return assert.isRejected(connx(cno, MQDetails));
            }
        }
    }).timeout(5000);
});

describe('open function', () => {
    let cno;
    let MQDetails;
    let credentials;
    let od;
    let hConn;

    beforeEach(() => {
        MQDetails = {};
        credentials = {};
        cno = new mq.MQCNO();
    });

    it('Should perform MQOPEN', async () => {
        for (let i = 0; i < envConfigLength; i++) {
            await buildMQDetails(MQDetails, credentials, i);
            await initialise(cno, MQDetails, credentials);
            hConn = await connx(cno, MQDetails);
            od = await open(hConn, MQDetails);
            expect(od._name).to.equal(envConfig.MQ_ENDPOINTS[i].QUEUE_NAME);
            expect(od._mqQueueManager._name).to.equal(envConfig.MQ_ENDPOINTS[i].QMGR);
            expect(od._hObj).to.equal(101);
        }
    }).timeout(5000);
});

describe('close function', () => {
    let cno;
    let MQDetails;
    let credentials;
    let hConn;
    let od;
    let returnedPromiseVal;

    beforeEach(() => {
        MQDetails = {};
        credentials = {};
        cno = new mq.MQCNO();
    });

    it('Should perform MQCLOSE', async () => {
        for (let i = 0; i < envConfigLength; i++) {
            await buildMQDetails(MQDetails, credentials, i);
            await initialise(cno, MQDetails, credentials);
            hConn = await connx(cno, MQDetails);
            od = await open(hConn, MQDetails);
            return assert.isFulfilled(close(od, i));
        }
    }).timeout(5000);
});

describe('disc function', () => {
    let cno;
    let MQDetails;
    let credentials;
    let hConn;

    beforeEach(() => {
        MQDetails = {};
        credentials = {};
        cno = new mq.MQCNO();
    });

    it('Should perform MQDISC', async () => {
        for (let i = 0; i < envConfigLength; i++) {
            await buildMQDetails(MQDetails, credentials, i);
            await initialise(cno, MQDetails, credentials);
            hConn = await connx(cno, MQDetails);
            await open(hConn, MQDetails);
            return assert.isFulfilled(disconnect(hConn, i));
        }
    }).timeout(5000);
});

describe('getMessage function', async () => {
    let cno;
    let MQDetails;
    let credentials;
    let hConn;
    let hObj;
    let rcvMsg;

    beforeEach(() => {
        MQDetails = {};
        credentials = {};
        cno = new mq.MQCNO();
    });

    it('Should perform MQGET', async () => {
        for (let i = 0; i < envConfigLength; i++) {
            await buildMQDetails(MQDetails, credentials, i);
            await initialise(cno, MQDetails, credentials);
            hConn = await connx(cno, MQDetails);
            hObj = await open(hConn, MQDetails);

            // We run the basicput sample to put a message into the queue, following which we run the getMessage
            // function to retrieve the message we just put.
            exec('node basicput.js', async function (err, stdout, stderr) {
                rcvMsg = await getMessage(hObj);
                expect(rcvMsg).to.eventually.equal(true); // This is the method to test a function that returns a promise.
            })
        }
    }).timeout(5000);
});