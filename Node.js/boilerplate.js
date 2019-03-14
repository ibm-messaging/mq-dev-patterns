/**
 * Copyright 2018, 2019 IBM Corp.
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

// Import the MQ package
const mq = require('ibmmq');

// Load up missing envrionment variables from the .env settings file.
require('dotenv').load();

// Set up debug logging options
var debug_info = require('debug')('boiler:info');
var debug_warn = require('debug')('boiler:warn');

var MQC = mq.MQC;
var count = 0;
var LIMIT = 5;
var waitInterval = 10; // max seconds to wait for a new message
var canExit = false;
var activeCB = null;

var MQDetails = {
  QMGR: process.env.QMGR,
  QUEUE_NAME: process.env.QUEUE_NAME,
  MODEL_QUEUE_NAME: process.env.MODEL_QUEUE_NAME,
  DYNAMIC_QUEUE_PREFIX: process.env.DYNAMIC_QUEUE_PREFIX,
  TOPIC_NAME: process.env.TOPIC_NAME,
  HOST: process.env.HOST,
  PORT: process.env.PORT,
  CHANNEL: process.env.CHANNEL,
  KEY_REPOSITORY: process.env.KEY_REPOSITORY,
  CIPHER: process.env.CIPHER
}

var credentials = {
  USER: process.env.APP_USER,
  PASSWORD: process.env.APP_PASSWORD
}

class MQBoilerPlate {
  constructor() {
    this.mqConn = null;
    this.mqObj = null;
    this.mqDynObj = null;
    this.mqDynReplyObj = null;
    this.hObjSubscription = null;
    this.modeType = null;
    debug_info('MQi Boilerplate constructed');
  }

  initialise(type) {
    var me = this;
    me.modeType = type;
    return new Promise(function resolver(resolve, reject) {
      MQBoilerPlate.buildMQCNO()
        .then((mqcno) => {
          return MQBoilerPlate.connectToMQ(mqcno);
        })
        .then((hConn) => {
          me.mqConn = hConn;
          if ('SUBSCRIBE' === me.modeType) {
            return MQBoilerPlate.openMQSubscription(me.mqConn, me.modeType);
          }
          return MQBoilerPlate.openMQConnection(me.mqConn, me.modeType);
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
    MQBoilerPlate.closeMQConnection(this.mqObj)
      .then(() => {
        this.mqObj = null;
        return MQBoilerPlate.disconnectFromMQ(this.mqConn);
      })
      .then(() => {
        this.mqConn = null;
      })
  }

  putRequest(msg) {
    debug_info('Preparing for Request');
    var mqmd = new mq.MQMD(); // Defaults are fine.
    mqmd.ReplyToQ = this.mqDynObj._name;
    mqmd.MsgType = MQC.MQMT_REQUEST;
    return this.send(msg, mqmd, 'NORMAL');
  }

  putMessage(msg) {
    debug_info('Preparing for Put');
    // Defaults are fine.
    var mqmd = new mq.MQMD()
    return this.send(msg, mqmd, 'NORMAL');
  }

  replyMessage(msgId, correlId, msg) {
    debug_info('Preparing for Reply Put');
    // Defaults are fine.
    var mqmd = new mq.MQMD()
    mqmd.CorrelId = correlId;
    mqmd.MsgId = msgId;

    return this.send(msg, mqmd, 'REPLY');
  }

  send(msg, mqmd, mode) {
    debug_info('Preparing for MQPUT');
    var me = this;
    return new Promise(function resolver(resolve, reject) {
      var pmo = new mq.MQPMO();
      var queue = me.mqObj;

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

      debug_info('Putting Message on Queue in mode ', me.modeType);
      mq.Put(queue, mqmd, pmo, msg, function(err) {
        if (MQBoilerPlate.isPublishNoSubscriptions(me.modeType, err)) {
          debug_info('Publish unsuccessful because there are no subscribers', err.mqrcstr);
        } else if (err) {
          MQBoilerPlate.reportError(err);
          reject();
        } else {
          debug_info("MQPUT successful ", me.modeType);
          var msgId = MQBoilerPlate.toHexString(mqmd.MsgId);
          debug_info('MsgId: ', msgId);
          debug_info("MQPUT successful");
          resolve(msgId);
        }
      });

    });
  }

  getMessagesDynamicQueue(msgId, cb) {
    return this.getMessagesFromQueue(this.mqDynObj, msgId, cb);
  }

  getMessages(msgId, cb) {
    debug_info('In getMessages');
    return this.getMessagesFromQueue(this.mqObj, msgId, cb);
  }

  getMessagesFromQueue(queueObj, msgId, cb) {
    debug_info('In getMessagesFromQueue');
    var me = this;
    activeCB = cb;
    return new Promise(function resolver(resolve, reject) {
      var md = new mq.MQMD();
      var gmo = new mq.MQGMO();

      gmo.Options = MQC.MQGMO_NO_SYNCPOINT |
        MQC.MQGMO_WAIT |
        MQC.MQGMO_CONVERT |
        MQC.MQGMO_FAIL_IF_QUIESCING;

      if ('GET' === me.modeType) {
        gmo.MatchOptions = MQC.MQMO_NONE;
      }

      gmo.WaitInterval = waitInterval * 1000; //

      if (msgId != null) {
        console.log("Setting Match Option for MsgId");
        gmo.MatchOptions = MQC.MQMO_MATCH_MSG_ID;
        md.MsgId = MQBoilerPlate.hexToBytes(msgId);
      }

      // Set up the callback handler to be invoked when there
      // are any incoming messages. As this is a sample, I'm going
      // to tune down the poll interval from default 10 seconds to 0.5s.
      mq.setTuningParameters({
        getLoopPollTimeMs: 500
      });
      mq.Get(queueObj, md, gmo, me.getCallback);
      resolve();
    });
  }

  checkForTermination() {
    return new Promise(function resolver(resolve, reject) {
      var timerID = setInterval(() => {
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

  static buildMQCNO() {
    debug_info('Establishing connection details');
    var mqcno = new mq.MQCNO();
    // use MQCNO_CLIENT_BINDING to connect as client
    // cno.Options = MQC.MQCNO_NONE;
    mqcno.Options = MQC.MQCNO_CLIENT_BINDING;

    // For no authentication, disable this block
    if (credentials.USER) {
      var csp = new mq.MQCSP();
      csp.UserId = credentials.USER;
      csp.Password = credentials.PASSWORD;
      mqcno.SecurityParms = csp;
    }

    // And then fill in relevant fields for the MQCD
    var cd = new mq.MQCD();
    cd.ConnectionName = `${MQDetails.HOST}(${MQDetails.PORT})`;
    cd.ChannelName = MQDetails.CHANNEL;

    if (MQDetails.KEY_REPOSITORY) {
      debug_info('Will be running in TLS Mode');
      // *** For TLS ***
      var sco = new mq.MQSCO();

      // *** For TLS ***
      // The TLS parameters are the minimal set needed here. You might
      // want more control such as SSLPEER values.
      // This SSLClientAuth setting means that this program does not need to
      // present a certificate to the server - but it must match how the
      // SVRCONN is defined on the queue manager.
      cd.SSLCipherSpec = MQDetails.CIPHER;
      cd.SSLClientAuth = MQC.MQSCA_OPTIONAL;

      // *** For TLS ***
      // Set the SSL/TLS Configuration Options structure field that
      // specifies the keystore (expect to see a .kdb, .sth and .rdb
      // with the same root name). For this program, all we need is for
      // the keystore to contain the signing information for the queue manager's
      // cert.
      sco.KeyRepository = MQDetails.KEY_REPOSITORY;
      // And make the CNO refer to the SSL Connection Options
      mqcno.SSLConfig = sco;
    }

    // Make the MQCNO refer to the MQCD
    mqcno.ClientConn = cd;

    return Promise.resolve(mqcno);
  }

  static connectToMQ(cno) {
    return new Promise(function resolver(resolve, reject) {
      debug_info('Attempting Connection to MQ');
      mq.Connx(MQDetails.QMGR, cno, function(err, hConn) {
        debug_info('Inside Connection Callback function');
        if (err) {
          reject(err);
        } else {
          debug_info("MQCONN to %s successful ", MQDetails.QMGR);
          resolve(hConn);
        }
      });
    });
  }

  openMQDynamicConnection() {
    var me = this;
    debug_info('About to build dynamic connection');

    return new Promise(function resolver(resolve, reject) {
      MQBoilerPlate.openMQConnection(me.mqConn, 'DYNPUT')
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

  openMQReplyToConnection(replyToQ) {
    let me = this;
    MQDetails.ReplyQueue = replyToQ;
    return new Promise(function resolver(resolve, reject) {
      MQBoilerPlate.openMQConnection(me.mqConn, 'DYNREP')
        .then((data) => {
          if (data.hObj) {
            me.mqDynReplyObj = data.hObj;
          }
          resolve();
        })
        .catch((err) => {
          MQBoilerPlate.reportError(err);
          reject();
        });
    });
  }


  static openMQConnection(hConn, type) {
    return new Promise(function resolver(resolve, reject) {
      var od = new mq.MQOD();

      debug_info('Opening Connection running mode ', type);

      switch (type) {
        case 'PUT':
        case 'GET':
          od.ObjectName = MQDetails.QUEUE_NAME;
          od.ObjectType = MQC.MQOT_Q;
          break;
        case 'PUBLISH':
          od.ObjectString = MQDetails.TOPIC_NAME;
          od.ObjectType = MQC.MQOT_TOPIC;
          break;
        case 'DYNPUT':
          od.ObjectName = MQDetails.MODEL_QUEUE_NAME;
          od.DynamicQName = MQDetails.DYNAMIC_QUEUE_PREFIX;
          break;
        case 'DYNREP':
          od.ObjectName = MQDetails.ReplyQueue;
          od.ObjectType = MQC.MQOT_Q;
          break;
      }

      var openOptions = null;
      switch (type) {
        case 'PUT':
        case 'PUBLISH':
        case 'DYNREP':
          openOptions = MQC.MQOO_OUTPUT;
          break;
        case 'GET':
          openOptions = MQC.MQOO_INPUT_AS_Q_DEF;
          break;
        case 'DYNPUT':
          openOptions = MQC.MQOO_INPUT_EXCLUSIVE;
          break;
      }

      debug_info('Attempting connection to MQ ', od.ObjectName);
      mq.Open(hConn, od, openOptions, function(err, hObj) {
        debug_info('Inside MQ Open Callback function');
        if (err) {
          reject(err);
        } else {
          debug_info("MQOPEN of %s successful", MQDetails.QUEUE_NAME);
          let data = {
            'hObj': hObj
          };
          resolve(data);
        }
      });
    });
  }

  static openMQSubscription(hConn, type) {
    return new Promise(function resolver(resolve, reject) {
      // Define what we want to open, and how we want to open it.
      var sd = new mq.MQSD();
      sd.ObjectString = MQDetails.TOPIC_NAME;
      sd.Options = MQC.MQSO_CREATE |
        MQC.MQSO_NON_DURABLE |
        MQC.MQSO_FAIL_IF_QUIESCING |
        MQC.MQSO_MANAGED;

      debug_info('Opening Connection running mode ', type);

      mq.Sub(hConn, null, sd, function(err, hObj, hObjSubscription) {
        debug_info('Inside MQ Open Callback function');
        if (err) {
          reject(err);
        } else {
          debug_info("MQOPEN of %s successful", MQDetails.QUEUE_NAME);
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
    if (hObjSubscription) {
      try {
        mq.Close(hObjSubscription, 0);
        debug_info("MQCLOSE (Subscription) successful");
      } catch (err) {
        debug_warn("MQCLOSE (Subscription) ended with reason " + err.mqrc);
      }
    }
  }

  static closeMQConnection(hObj) {
    return new Promise(function resolver(resolve, reject) {
      if (hObj) {
        mq.Close(hObj, 0, function(err) {
          if (err) {
            //console.log(formatErr(err));
            MQBoilerPlate.reportError(err);
          } else {
            debug_info("MQCLOSE successful");
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  static disconnectFromMQ(hConn) {
    return new Promise(function resolver(resolve, reject) {
      if (hConn) {
        mq.Disc(hConn, function(err) {
          if (err) {
            debug_warn('Error Detected in Disconnect operation', err);
          } else {
            debug_info("MQDISC successful");
          }
        });
      } else {
        resolve();
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
        canExit = true;
      }
      // We don't need any more messages delivered, so cause the
      // callback to be deleted after this one has completed.
      //mq.GetDone(hObj);
    } else {
      if (activeCB) {
        canExit = !activeCB(md, buf);
      }
    }
  }

  static reportError(err) {
    var errMsg = err.message ? err.message : err;
    debug_warn("MQ call failed with error : " + errMsg);
  }

}

var mqboiler = new MQBoilerPlate();
module.exports = mqboiler;
