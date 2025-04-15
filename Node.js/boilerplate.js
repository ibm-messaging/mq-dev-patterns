/**
 * Copyright 2018, 2025 IBM Corp.
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

// This is a MQ boiler plate library making use of the
// the MQI Node.js interface

const fs = require('fs');
// Import the MQ package
const mq = require('ibmmq');

// Import libraries for JWT authentication
const https = require('https');
const axios = require('axios');
const querystring = require('querystring');
const fetch = require('node-fetch');

// Load up missing envrionment variables from the env.json file
var env = require('../env.json');

// Set up debug logging options
var debug_info = require('debug')('boiler:info');
var debug_warn = require('debug')('boiler:warn');

var MQC = mq.MQC;
var count = 0;
var LIMIT = 5;
var waitInterval = 10; // max seconds to wait for a new message
var canExit = false;
var activeCB = null;
var bpInstance = null;

// Set up Constants
const CCDT = "MQCCDTURL";
const FILEPREFIX = "file://";


class MQBoilerPlate {
  constructor() {
    this.mqConn = null;
    this.mqObj = null;
    this.mqDynObj = null;
    this.mqDynReplyObj = null;
    this.hObjSubscription = null;
    this.modeType = null;
    this.index = 0;
    this.beSync = null;
    this.MQDetails = {};
    this.credentials = {};
    bpInstance = this;
    debug_info('MQi Boilerplate constructed');
  }

  initialise(type, sync = false, i = 0) {
    let me = this;
    me.modeType = type;
    me.index = i;
    me.beSync = sync;

    return new Promise(function resolver(resolve, reject) {
      me.buildMQDetails()
        .then(() => {
          return me.buildMQCNO();
        })
        .then((mqcno) => {
          return me.connectToMQ(mqcno);
        })
        .then((hConn) => {
          me.mqConn = hConn;
          if ('SUBSCRIBE' === me.modeType) {
            return me.openMQSubscription(me.mqConn, me.modeType);
          }
          return me.openMQConnection(me.mqConn, me.modeType, me.beSync);
        })
        .then((data) => {
          if (data.hObj) {
            me.mqObj = data.hObj;
          }
          if (data.hObjSubscription) {
            me.hObjSubscription = data.hObjSubscription;
          }
          resolve();
        })
        .catch((err) => {
          MQBoilerPlate.reportError(err);
          reject();
        });
    });
  }

  teardown() {
    debug_info('Closing MQ');
    MQBoilerPlate.closeSubscription(this.hObjSubscription);
    let me = this;
    return new Promise(function resolver(resolve, reject) {
      MQBoilerPlate.closeMQConnection(me.mqObj)
        .then(() => {
          me.mqObj = null;
          return MQBoilerPlate.disconnectFromMQ(me.mqConn);
        })
        .then(() => {
          me.mqConn = null;
          resolve();
        })
        .catch((err) => {
          debug_warn(err);
          reject(err);
        });
    });
  }

  // Load the MQ Endpoint details either from the envrionment or from the
  // env.json file. The environment takes precedence. The json file allows for
  // multiple endpoints ala a cluster, but for this sample only the first
  // endpoint in the array is used.
  buildMQDetails() {
    let i = this.index;
    if (env.MQ_ENDPOINTS.length > i) {
      ['QMGR', 'QUEUE_NAME', 'TOPIC_NAME',
        'MODEL_QUEUE_NAME', 'DYNAMIC_QUEUE_PREFIX', 'BACKOUT_QUEUE',
        'HOST', 'PORT',
        'CHANNEL', 'KEY_REPOSITORY', 'CIPHER'].forEach((f) => {
          this.MQDetails[f] = process.env[f] || env.MQ_ENDPOINTS[i][f];
        });
      ['USER', 'PASSWORD'].forEach((f) => {
        let pField = 'APP_' + f;
        this.credentials[f] = process.env[pField] || env.MQ_ENDPOINTS[i][pField];
      });
    }
    
    // Load the JWT Endpoint details from the env.json file, if enabled
    // The json file allows for multiple endpoints, for seperate token issuers
    if (env.JWT_ISSUER) {
      ['JWT_TOKEN_ENDPOINT', 'JWT_TOKEN_USERNAME', 'JWT_TOKEN_PWD', 'JWT_TOKEN_CLIENTID', 'JWT_KEY_REPOSITORY'].forEach((f) => {
        this.MQDetails[f] = process.env[f] || env.JWT_ISSUER[i][f];
      });
    } else {
      debug_info('jwt credentials not found');
    }

    return Promise.resolve();
  }

  putRequest(msg) {
    debug_info('Preparing for Request');
    let mqmd = new mq.MQMD(); // Defaults are fine.
    mqmd.ReplyToQ = this.mqDynObj._name;
    mqmd.MsgType = MQC.MQMT_REQUEST;
    return this.send(msg, mqmd, 'NORMAL');
  }

  putMessage(msg) {
    debug_info('Preparing for Put');
    // Defaults are fine.
    let mqmd = new mq.MQMD()
    mqmd.Persistence = MQC.MQPER_PERSISTENT;
    return this.send(msg, mqmd, 'NORMAL');
  }

  replyMessage(msgId, correlId, msg) {
    debug_info('Preparing for Reply Put');
    // Defaults are fine.
    let mqmd = new mq.MQMD();
    mqmd.CorrelId = correlId;
    mqmd.MsgId = msgId;

    return this.send(msg, mqmd, 'REPLY');
  }

  send(msg, mqmd, mode) {
    debug_info('Preparing for MQPUT');
    let me = this;
    return new Promise(function resolver(resolve, reject) {
      let pmo = new mq.MQPMO();
      let queue = me.mqObj;

      // Describe how the Put should behave
      pmo.Options = MQC.MQPMO_NO_SYNCPOINT;

      if ('REPLY' === mode) {
        queue = me.mqDynReplyObj;
      } else {
        pmo.Options |= MQC.MQPMO_NEW_MSG_ID |
          MQC.MQPMO_NEW_CORREL_ID;
      }

      if ('PUBLISH' === me.modeType) {
        pmo.Options |= MQC.MQPMO_WARN_IF_NO_SUBS_MATCHED;
      }

      debug_info('Putting Message on Queue in mode ', mode);
      // We initialise the putCall variable with the default Put function of MQ when the mode is not a Request-Response
      // type. When the mode is of type "REPLY", belonging to the Request-Response scenario, we switch to the Synchronous
      // version of Put. This is necessary, since there is already an async get callback in the responder application.
      // Adding another async on top of the async callback, causes the MQRC 2500. To avoid this, we use the synchronous version
      // of Put.
      let putCall = mq.Put;
      if ('REPLY' === mode) {
        debug_info('Switching to PutSync')
        putCall = mq.PutSync
      }
      putCall(queue, mqmd, pmo, msg, function (err) {
        if (MQBoilerPlate.isPublishNoSubscriptions(me.modeType, err)) {
          debug_info('Publish unsuccessful because there are no subscribers', err.mqrcstr);
        } else if (err) {
          MQBoilerPlate.reportError(err);
          reject();
        } else {
          debug_info("MQPUT successful ", me.modeType);
          let msgId = MQBoilerPlate.toHexString(mqmd.MsgId);
          debug_info('MsgId: ', msgId);
          debug_info("MQPUT successful");
          resolve(msgId);
        }
      });

    });
  }

  rollback(buf, md, poisoningMessageHandle) {
    let me = this;
    return new Promise(function resolver(resolve, reject) {
      if (!poisoningMessageHandle(buf, md)) {
        resolve();
      } else {
        mq.Back(me.mqConn, function (err) {
          if (err) {
            debug_warn('Error on rollback', err);
            reject(err);
          } else {
            debug_info('Rollback Succesful');
            resolve();
          }
        })
      }
    })
  }

  commit() {
    let me = this;
    return new Promise(function resolver(resolve, reject) {
      mq.Cmit(me.mqConn, function (err) {
        if (err) {
          debug_warn('Error on Commit', err);
          reject(err);
        } else {
          debug_info('Commit Successful');
          resolve();
        }
      })
    })
  };

  getMessagesDynamicQueue(msgId, cb) {
    return this.getMessagesFromQueue(this.mqDynObj, msgId, cb);
  }

  getMessages(msgId, cb) {
    debug_info('In getMessages');
    return this.getMessagesFromQueue(this.mqObj, msgId, cb);
  }

  getMessagesFromQueue(queueObj, msgId, cb) {
    debug_info('In getMessagesFromQueue');
    let me = this;
    activeCB = cb;
    return new Promise(function resolver(resolve, reject) {
      let md = new mq.MQMD();
      let gmo = new mq.MQGMO();

      if (me.beSync) {
        gmo.Options = MQC.MQPMO_SYNCPOINT |
          MQC.MQGMO_WAIT |
          MQC.MQGMO_CONVERT |
          MQC.MQGMO_FAIL_IF_QUIESCING;
      } else {
        gmo.Options = MQC.MQPMO_NO_SYNCPOINT |
          MQC.MQGMO_WAIT |
          MQC.MQGMO_CONVERT |
          MQC.MQGMO_FAIL_IF_QUIESCING;
      }

      switch (me.modeType) {
        case 'GET':
        case 'SUBSCRIBE':
          gmo.MatchOptions = MQC.MQMO_NONE;
      }

      gmo.WaitInterval = waitInterval * 1000; //

      if (msgId != null) {
        debug_info("Setting Match Option for MsgId");
        gmo.MatchOptions = MQC.MQMO_MATCH_MSG_ID;
        md.MsgId = MQBoilerPlate.hexToBytes(msgId);
      }

      mq.Get(queueObj, md, gmo, me.getCallback);
      resolve();
    });
  }

  // Starts the Async process to invoke the Get message callback in mq.Get
  startGetAsyncProcess() {
    debug_info('Enabling callback');
    let me = this;
    return new Promise(function resolver(resolve, reject) {
      mq.Ctl(me.mqConn, MQC.MQOP_START, (err) => {
        if (err) {
          debug_warn('Error enabling get callback ', err);
          reject(err);
        } else {
          debug_info('Get Async callback now running');
          resolve();
        }
      });
    });
  }

  // Suspends the Async Get process of the response application temporarily so that the reply to queue can be accessed.
  // If this is not suspended, MQ throws an error with reason code 2500 : MQRC_HCONN_ASYNC_ACTIVE, since an async call is already
  // active, so another async call on top of it cannot be processed.
  suspendAsyncProcess() {
    debug_info('Suspending callback');
    let me = this;
    return new Promise(function resolver(resolve, reject) {
      mq.Ctl(me.mqConn, MQC.MQOP_SUSPEND, (err) => {
        if (err) {
          debug_warn('Error suspending get callback ', err);
          reject(err);
        } else {
          debug_info('Get Async callback now suspended');
          resolve();
        }
      });
    });
  }

  // Resumes the background async Get in the response application.
  resumeAsyncProcess() {
    debug_info('Resuming callback');
    let me = this;
    return new Promise(function resolver(resolve, reject) {
      mq.Ctl(me.mqConn, MQC.MQOP_RESUME, (err) => {
        if (err) {
          debug_warn('Error resuming get callback ', err);
          reject(err);
        } else {
          debug_info('Get Async callback now resumed');
          resolve();
        }
      });
    });
  }

  // Function to signal the callback thread to terminate listening to the Queue for anymore messages.
  signalDone() {
    debug_info('Signalling callback thread to terminate');
    let me = this;
    return new Promise(function resolver(resolve, reject) {
      mq.GetDone(me.mqObj);
      resolve();
    });
  }


  checkForTermination() {
    return new Promise(function resolver(resolve, reject) {
      let timerID = setInterval(() => {
        debug_info('Checking for termination signal');
        count++;

        if (count > LIMIT) {
          canExit = true;
        }

        if (canExit) {
          clearInterval(timerID);
          resolve();
        }

      }, (waitInterval + 2) * 1000);
    });
  }

  static isPublishNoSubscriptions(type, err) {
    return ('PUBLISH' === type &&
      err && 'object' === typeof err && err.mqrc &&
      MQC.MQRC_NO_SUBS_MATCHED == err.mqrc && err.mqrcstr);
  }

  static hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
  }

  static toHexString(byteArray) {
    return byteArray.reduce((output, elem) =>
      (output + ('0' + elem.toString(16)).slice(-2)),
      '');
  }

  getConnection() {
    let points = [];
    env.MQ_ENDPOINTS.forEach((p) => {
      if (p['HOST'] && p['PORT']) {
        points.push(`${p.HOST}(${p.PORT})`)
      }
    });
    return points.join(',');
  }

  getConnectionAt() {
    let i = this.index;
    if (env.MQ_ENDPOINTS.length <= i) {
      i = 0;
    }
    return `${env.MQ_ENDPOINTS[i].HOST}(${env.MQ_ENDPOINTS[i].PORT})`;
  }

  jwtCheck(MQDetails) {

    if (!env.JWT_ISSUER) {

      debug_info('JWT credentials not found, will not be using JWT to authenticate');
      return false;

    } else if (MQDetails.JWT_TOKEN_ENDPOINT === null || MQDetails.JWT_TOKEN_USERNAME === null || 
        MQDetails.JWT_TOKEN_PWD === null || MQDetails.JWT_TOKEN_CLIENTID === null) {

      debug_info('One or more JWT credentials missing, will not be using JWT to authenticate');
      return false;
    } 

    debug_info('JWT credentials found, will be using JWT to authenticate');
    return true;
  }

  async obtainToken() {
    // Asynchronous function to handle http & https requests
    let me = this;
    let accessToken;

    debug_info('Obtaining token from:', me.MQDetails.JWT_TOKEN_ENDPOINT);
    
    let formData = querystring.stringify({
      username: me.MQDetails.JWT_TOKEN_USERNAME,
      password: me.MQDetails.JWT_TOKEN_PWD,
      client_id: me.MQDetails.JWT_TOKEN_CLIENTID,
      grant_type: "password",
    });

    // Regex to extract the hostname:port out of the endpoint
    // This is used to ensure the correct URL is used for the request
    // and the JWT obtained has a valid 'iss' claim
    let match = me.MQDetails.JWT_TOKEN_ENDPOINT.match(/^https?:\/\/([^/]+)/i);
    let hostAndPort = match ? match[1] : null;
    
    // Creating server request
    let options = {
      method: 'POST',
      url: me.MQDetails.JWT_TOKEN_ENDPOINT,
      data: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": formData.length,
        "Host": hostAndPort,
      }
    }

    // Checking for JWT authentication with JWKS
    // If key repository is enabled, the https server (token issuer) can be trusted
    // with this public certificate
    if (me.MQDetails.JWT_KEY_REPOSITORY) {
      options.httpsAgent = new https.Agent({ ca: fs.readFileSync(me.MQDetails.JWT_KEY_REPOSITORY)});
    }
      
    // Sending request to token server
    // Wait until response received
    let response = await axios(options);

    // Extracting access token out of JSON response 
    accessToken = response.data.access_token;
    debug_info('Using token:', accessToken);

    return accessToken;
  }

  async buildMQCNO() {
    debug_info('Establishing connection details');
    let mqcno = new mq.MQCNO();
    // use MQCNO_CLIENT_BINDING to connect as client
    // cno.Options = MQC.MQCNO_NONE;
    mqcno.Options = MQC.MQCNO_CLIENT_BINDING;

    // For no authentication, disable this block
    // If JWT enabled, a JWT will be used to authenticate to MQ,
    // otherwise will default to username and password authenftication
    if (this.jwtCheck(this.MQDetails)) {  

      // Asynchronous handling, to ensure code blocks on the server request
      // Waits for a response, if request fails, the error is caught
      try {
        let accessToken = await this.obtainToken();
        let csp = new mq.MQCSP();
        csp.Token = accessToken; 
        mqcno.SecurityParms = csp;

      } catch (error) {
        debug_warn('Failed to obtain token:', error);

      }
    } else if (this.credentials.USER) {
      let csp = new mq.MQCSP();
      csp.UserId = this.credentials.USER;
      csp.Password = this.credentials.PASSWORD;
      mqcno.SecurityParms = csp;
    }

    let sco = null;

    if (this.MQDetails.KEY_REPOSITORY) {
      debug_info('Key Repository has been specified');
      // *** For TLS ***
      sco = new mq.MQSCO();

      // *** For TLS ***
      // Set the SSL/TLS Configuration Options structure field that
      // specifies the keystore (expect to see a .kdb, .sth and .rdb
      // with the same root name). For this program, all we need is for
      // the keystore to contain the signing information for the queue manager's
      // cert.
      sco.KeyRepository = this.MQDetails.KEY_REPOSITORY;
      // And make the CNO refer to the SSL Connection Options
      mqcno.SSLConfig = sco;
    }


    if (!MQBoilerPlate.ccdtCheck()) {
      debug_info('CCDT URL export is not set, will be using json environment client connections settings');
      // And then fill in relevant fields for the MQCD
      let cd = new mq.MQCD();
      cd.ChannelName = this.MQDetails.CHANNEL;

      if ('GET' === this.modeType) {
        cd.ConnectionName = this.getConnectionAt();
      } else {
        cd.ConnectionName = this.getConnection();
      }

      debug_info('Connections string is ', cd.ConnectionName);

      if (this.MQDetails.KEY_REPOSITORY) {
        debug_info('Will be running in TLS Mode');

        // *** For TLS ***
        // The TLS parameters are the minimal set needed here. You might
        // want more control such as SSLPEER values.
        // This SSLClientAuth setting means that this program does not need to
        // present a certificate to the server - but it must match how the
        // SVRCONN is defined on the queue manager.
        cd.SSLCipherSpec = this.MQDetails.CIPHER;
        cd.SSLClientAuth = MQC.MQSCA_OPTIONAL;

        // And make the CNO refer to the SSL Connection Options
        mqcno.SSLConfig = sco;
      }

      // Make the MQCNO refer to the MQCD
      mqcno.ClientConn = cd;
    }

    return Promise.resolve(mqcno);
  }

  connectToMQ(cno) {
    let me = this;
    return new Promise(function resolver(resolve, reject) {
      debug_info('Attempting Connection to MQ');
      mq.Connx(me.MQDetails.QMGR, cno, function (err, hConn) {
        debug_info('Inside Connection Callback function');
        if (err) {
          reject(err);
        } else {
          debug_info("MQCONN to %s successful ", me.MQDetails.QMGR);
          resolve(hConn);
        }
      });
    });
  }

  openMQDynamicConnection() {
    let me = this;
    debug_info('About to build dynamic connection');

    return new Promise(function resolver(resolve, reject) {
      me.openMQConnection(me.mqConn, 'DYNPUT')
        .then((data) => {
          if (data.hObj) {
            me.mqDynObj = data.hObj;
          }
          resolve();
        })
        .catch((err) => {
          MQBoilerPlate.reportError(err);
          reject();
        });

    });
  }

  openMQReplyToConnection(replyToQ, type) {
    let me = this;
    me.MQDetails.ReplyQueue = replyToQ;
    return new Promise(function resolver(resolve, reject) {
      debug_info('Opening reply to connection');
      me.openMQConnection(me.mqConn, type)
        .then((data) => {
          if (data.hObj) {
            me.mqDynReplyObj = data.hObj;
          }
          resolve();
        })
        .catch((err) => {
          MQBoilerPlate.reportError(err);
          reject(err);
        });
    });
  }


  openMQConnection(hConn, type) {
    let me = this;
    return new Promise(function resolver(resolve, reject) {
      let od = new mq.MQOD();

      switch (type) {
        case 'PUT':
        case 'GET':
          od.ObjectName = me.MQDetails.QUEUE_NAME;
          od.ObjectType = MQC.MQOT_Q;
          break;
        case 'PUBLISH':
          od.ObjectString = me.MQDetails.TOPIC_NAME;
          od.ObjectType = MQC.MQOT_TOPIC;
          break;
        case 'DYNPUT':
          od.ObjectName = me.MQDetails.MODEL_QUEUE_NAME;
          od.DynamicQName = me.MQDetails.DYNAMIC_QUEUE_PREFIX;
          break;
        case 'DYNREP':
          od.ObjectName = me.MQDetails.ReplyQueue;
          od.ObjectType = MQC.MQOT_Q;
          break;
      }

      debug_info(`Opening Connection to ${od.ObjectName} in mode ${type}`);

      let openOptions = null;
      switch (type) {
        case 'PUT':
        case 'PUBLISH':
        case 'DYNREP':
          openOptions = MQC.MQOO_OUTPUT;
          break;
        case 'GET':
          openOptions = (me.beSync) ? MQC.MQPMO_SYNCPOINT : MQC.MQOO_INPUT_AS_Q_DEF;
          break;
        case 'DYNPUT':
          openOptions = MQC.MQOO_INPUT_EXCLUSIVE;
          break;
      }

      debug_info('Attempting connection to MQ ', od.ObjectName);

      // We initialise the openCall variable with the default Open call of MQ when the type is not part of the
      // Request-Response scenario. When the type is "DYNREP", we refer to the response application, which is trying to open
      // the dynamic reply to queue. Since the default Open call is an asynchronous call, and the responder application has a 
      // background async get call, adding another async on top of the async callback, causes the MQRC 2500. 
      // To avoid this, we switch to the synchronous version of Open when in a Request-Response scenario.
      let openCall = mq.Open;
      if ('DYNREP' === type) {
        debug_info('Switching to Synchronous Open');
        openCall = mq.OpenSync;
      }

      openCall(hConn, od, openOptions, function (err, hObj) {
        debug_info('Inside MQ Open Callback function');
        if (err) {
          reject(err);
        } else {
          debug_info("MQOPEN of %s successful", od.ObjectName);
          let data = {
            'hObj': hObj
          };
          resolve(data);
        }
      });
    });
  }

  openMQSubscription(hConn, type) {
    let me = this;
    return new Promise(function resolver(resolve, reject) {
      // Define what we want to open, and how we want to open it.
      let sd = new mq.MQSD();
      sd.ObjectString = me.MQDetails.TOPIC_NAME;
      sd.Options = MQC.MQSO_CREATE |
        MQC.MQSO_NON_DURABLE |
        MQC.MQSO_FAIL_IF_QUIESCING |
        MQC.MQSO_MANAGED;

      debug_info('Opening Connection running mode ', type);

      mq.Sub(hConn, null, sd, function (err, hObj, hObjSubscription) {
        debug_info('Inside MQ Open Callback function');
        if (err) {
          reject(err);
        } else {
          debug_info("MQSUB to topic of %s successfull", me.MQDetails.TOPIC_NAME);
          let data = {
            'hObj': hObj,
            'hObjSubscription': hObjSubscription
          };
          resolve(data);
        }
      });
    });
  }


  static closeSubscription(hObjSubscription) {
    return new Promise(function resolver(resolve, reject) {
      if (!hObjSubscription) {
        resolve();
      } else {
        mq.Close(hObjSubscription, 0, function (err) {
          if (err) {
            MQBoilerPlate.reportError(err);
            debug_info("MQCLOSE (Subscription) ended with reason " + err.mqrc);
            reject(err);
          } else {
            debug_info("MQCLOSE (Subcscription) sucessful");
            resolve();
          }
        });
      }
    });
  }

  static closeMQConnection(hObj) {
    return new Promise(function resolver(resolve, reject) {
      if (!hObj) {
        resolve();
      } else {
        mq.Close(hObj, 0, function (err) {
          if (err) {
            MQBoilerPlate.reportError(err);
            reject(err);
          } else {
            debug_info("MQCLOSE successful");
            resolve();
          }
        });
      }
    });
  }

  static disconnectFromMQ(hConn) {
    return new Promise(function resolver(resolve, reject) {
      if (!hConn) {
        resolve();
      } else {
        mq.Disc(hConn, function (err) {
          if (err) {
            debug_warn('Error Detected in Disconnect operation', err);
            reject(err);
          } else {
            debug_info("MQDISC successful");
            resolve();
          }
        });
      }
    });
  }

  /*
   * This function is the async callback. Parameters
   * include the message descriptor and the buffer containing
   * the message data.
   */
  getCallback(err, hObj, gmo, md, buf) {
    // If there is an error, prepare to exit by setting the ok flag to false.
    if (err) {
      if (err.mqrc == MQC.MQRC_NO_MSG_AVAILABLE) {
        debug_info("No more messages available.");
      } else {
        MQBoilerPlate.reportError(err);
      }
      canExit = true;
    } else {
      let cbProcessResponse = null;
      if (activeCB) {
        cbProcessResponse = bpInstance.activeCBReturnsPromise(md, buf);
      } else {
        cbProcessResponse = bpInstance.activeCBReturnsNoPromise(md, buf);
      }

      cbProcessResponse
        .then(() => {
          debug_info("Processing complete")
        })
        .catch((err) => {
          debug_warn("Error! : ", err)
        })
    }
  }

  // This is a helper function which is invoked in the scenario when the callback function returns an instance of a Promise.
  activeCBReturnsPromise(md, buf) {
    return new Promise(function resolver(resolve, reject) {
      let cbResponse = activeCB(md, buf);
      if (cbResponse instanceof Promise) {
        debug_info("Callback has returned an instance of a Promise");
        cbResponse
          .then((mustContinue) => {
            debug_info("INSIDE THE .then of the cbResponse")
            canExit = !mustContinue
          })
          .then(() => {
            debug_info("After the resume")
            resolve();
          })
          .catch((err) => {
            debug_warn(`Error invoking callback : ${err}`)
            canExit = true;
            reject();
          })
      } else {
        resolve();
      }
    })
  }

  // This is a helper function which is invoked in the scenario when the callback function does not returns an instance of a Promise.
  activeCBReturnsNoPromise(md, buf) {
    return new Promise(function resolver(resolve, reject) {
      canExit = !activeCB(md, buf);
      resolve();
    })
  }

  static reportError(err) {
    let errMsg = err.message ? err.message : err;
    debug_warn("MQ call failed with error : " + errMsg);
  }


  static ccdtCheck() {
    if (CCDT in process.env) {
      let ccdtFile = process.env[CCDT].replace(FILEPREFIX, '');
      debug_info(ccdtFile);
      if (fs.existsSync(ccdtFile)) {
        debug_info("CCDT File found at ", ccdtFile);
        return true;
      }
    }
    return false;
  }

}

//var mqboiler = new MQBoilerPlate();
//module.exports = mqboiler;
module.exports = MQBoilerPlate;
