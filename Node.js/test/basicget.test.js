const { buildMQDetails, ccdtCheck, initialise, connx, open, close, disconnect, getMessage } = require('../basicget');
const mq = require('ibmmq');
const envConfig = require('../../env.json');
const { assert, expect } = require('chai');
const envConfigLength = Object.keys(envConfig).length;
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
    it('Should return true if CCDT found in env, else false', () => {
        let flag = ccdtCheck();
        let CCDT = "MQCCDTURL";
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
            expect(cno.ClientConn.SSLCipherSpec).to.equal(envConfig.MQ_ENDPOINTS[i].CIPHER_SUITE);
            expect(cno.SSLConfig).to.exist;
            expect(cno.SSLConfig.KeyRepository).to.equal(envConfig.MQ_ENDPOINTS[i].KEY_REPOSITORY);
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
                await connx(cno, MQDetails);
                assert(true)
            } catch (err) {
                assert(false)
            }
        }
    }).timeout(5000);
});

describe('open function', () => {
    let cno;
    let MQDetails;
    let credentials;
    let od;
    let result;

    beforeEach(() => {
        MQDetails = {};
        credentials = {};
        cno = new mq.MQCNO();
    });

    it('Should perform MQOPEN', async () => {
        for (let i = 0; i < envConfigLength; i++) {
            await buildMQDetails(MQDetails, credentials, i);
            await initialise(cno, MQDetails, credentials);
            result = await connx(cno, MQDetails);
            od = await open(result, MQDetails);
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
    let result;
    let od;

    beforeEach(() => {
        MQDetails = {};
        credentials = {};
        cno = new mq.MQCNO();
    });

    it('Should perform MQCLOSE', async () => {
        for (let i = 0; i < envConfigLength; i++) {
            await buildMQDetails(MQDetails, credentials, i);
            await initialise(cno, MQDetails, credentials);
            result = await connx(cno, MQDetails);
            od = await open(result, MQDetails);
            await close(od._hObj, i);
            assert.equal(true, true);
        }
    }).timeout(5000);
});

describe('disc function', () => {
    let cno;
    let MQDetails;
    let credentials;
    let result;
    let od;

    beforeEach(() => {
        MQDetails = {};
        credentials = {};
        cno = new mq.MQCNO();
    });

    it('Should perform MQDISC', async () => {
        for (let i = 0; i < envConfigLength; i++) {
            await buildMQDetails(MQDetails, credentials, i);
            await initialise(cno, MQDetails, credentials);
            result = await connx(cno, MQDetails);
            od = await open(result, MQDetails);
            await disconnect(od._hObj, i);
            assert.equal(true, true);
        }
    }).timeout(5000);
});

describe('getMessage function', async () => {
    let cno;
    let MQDetails;
    let credentials;
    let result;
    let od;
    let msgObject;
    let msg;
    let mqmd;
    let pmo;

    beforeEach(() => {
        MQDetails = {};
        credentials = {};
        cno = new mq.MQCNO();
        selectors = [new mq.MQAttr(mq.MQC.MQIA_CURRENT_Q_DEPTH)];
        msgObject = { "Key": "0" };
        msg = JSON.stringify(msgObject)
        mqmd = new mq.MQMD(); // Defaults are fine.
        pmo = new mq.MQPMO();
        pmo.Options = MQC.MQPMO_NO_SYNCPOINT |
            MQC.MQPMO_NEW_MSG_ID |
            MQC.MQPMO_NEW_CORREL_ID;

        mqmd.Persistence = MQC.MQPER_PERSISTENT;
    });

    it('Should perform MQGET', async () => {
        for (let i = 0; i < envConfigLength; i++) {
            await buildMQDetails(MQDetails, credentials, i);
            await initialise(cno, MQDetails, credentials);
            result = await connx(cno, MQDetails);
            od = await open(result, MQDetails);
            mq.Put(od, mqmd, pmo, msg, function (err) {
                if (err) {
                    assert.throw(()=>console.log(err))
                }
            });
            let res = await getMessage(od);
            expect(res).to.equal(true);
        }
    }).timeout(5000);
});