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

const mq = require('ibmmq');

// Decoder needed to process GET messages
const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');

// Set up debug logging options
const debug_info = require('debug')('mqsample:otel:connection:info');
const debug_warn = require('debug')('mqsample:otel:connection:warn');

const {constants} = require('../settings/constants');
const {appLimits} = require('../settings/limits.js');

const DEFAULT_APP_NAME = constants.DEFAULT_APP_NAME;
const MQC = mq.MQC;

class MQConnection {
    #qmgrData = null;
    #applName = "";

    #mqcno = null;
    #hConn = null;
    #hQueue = null;

    constructor(qmgrData) {
        debug_info(`Creating connection for ${qmgrData[constants.QMGR]}`);

        this.#qmgrData = qmgrData;
        this.#applName = qmgrData.applName || DEFAULT_APP_NAME;
        this.#buildMQCNO();
    }

    connect() {
        let me = this;
        return new Promise(function resolver(resolve, reject) {
          debug_info('Attempting Connection to Queue Manager');
          mq.Connx(me.#qmgrData[constants.QMGR], me.#mqcno, function (err, hConn) {
            debug_info('Inside Connection Callback function');
            if (err) {
              reject(err);
            } else {
              debug_info("MQCONN to %s successful ", me.#qmgrData[constants.QMGR]);
              me.#hConn = hConn;
              resolve();
            }
          });
        });
    }

    open(type, queue) {
        let me = this;
        return new Promise(function resolver(resolve, reject) {
            debug_info(`Opening Connection to ${queue} in mode ${type}`);
            let od = new mq.MQOD();
    
            od.ObjectName = queue;
            od.ObjectType = MQC.MQOT_Q;

            let openOptions = null;
            switch (type) {
              case constants.PUT:
                openOptions = MQC.MQOO_OUTPUT;
                break;
              case constants.GET:
                openOptions = MQC.MQOO_INPUT_AS_Q_DEF;
                break;
            }

            mq.Open(me.#hConn, od, openOptions, function (err, hObj) {
                debug_info('Inside MQ Open Callback function');
                if (err) {
                  reject(err);
                } else {
                  debug_info("MQOPEN of %s successful", od.ObjectName);
                  me.#hQueue = hObj;
                  resolve();
                }
              });
        });
    }

    put(quantity, message) {
        var promises = [];

        for (let i = 0; i < quantity; i++) {
          let iteration = i + 1;
          let msgObject = {
            'Message' : message,
            'Count' : '' + iteration + ' of ' + quantity,
            'Sent': '' + new Date()
          }

          if (appLimits.shoulItFail()) {
            debug_info('**** Message being marked as promlematic');
            msgObject['Damaged'] = '**** Rouge Message ****';
          }

          let msg = JSON.stringify(msgObject);
    
          var mqmd = new mq.MQMD(); // Defaults are fine.
          var pmo = new mq.MQPMO();
    
          // Describe how the Put should behave
          pmo.Options = MQC.MQPMO_NO_SYNCPOINT |
            MQC.MQPMO_NEW_MSG_ID |
            MQC.MQPMO_NEW_CORREL_ID;
    
          debug_info('Putting message onto queue');            
          promises.push( mq.PutPromise(this.#hQueue, mqmd, pmo, msg) );
        }
        return Promise.all(promises);
    }

    get(limit) {
        let me = this;
        return new Promise((resolve, reject) => {
            let obtainedMessages = [];
            me.#getSomeMessages(obtainedMessages, limit)
            .then((allFoundMessages) => {
              debug_info("replying with messages obtained from get action");
              resolve(allFoundMessages);
            })
            .catch((err) => {
              reject(err);
            })
          });
    }

    teardown() {
        debug_info('Tearing down the connection'); 
        let me = this;
        return new Promise(function resolver(resolve, reject) {
          me.#closeMQConnection()
            .then(() => {
              me.#hQueue = null;
              return me.#disconnectFromMQ();
            })
            .then(() => {
              me.#hConn = null;
              resolve();
            })
            .catch((err) => {
              debug_warn(err);
              reject(err);
            });
        });      
    }

    reportError(err) {
        let errMsg =  err.message || err;
        debug_warn("MQ call failed with error : " + errMsg);
    }

    #buildMQCNO() {
        debug_info(`Creating CNO for ${this.#qmgrData[constants.QMGR]} request`);

        let mqcno = new mq.MQCNO();
        mqcno.Options = MQC.MQCNO_CLIENT_BINDING;
    
        // Set Application name
        mqcno.ApplName = this.#applName;

        //debug_info(this.#qmgrData);

        if (this.#qmgrData[constants.APP_USER]) {
            let csp = new mq.MQCSP();
            csp.UserId = this.#qmgrData[constants.APP_USER];
            csp.Password = this.#qmgrData[constants.APP_PASSWORD];
            mqcno.SecurityParms = csp;
        }

        let sco = this.#determineSCO(mqcno);

        // Make the MQCNO refer to the MQCD
        mqcno.ClientConn = this.#buildClientConnection(mqcno);
        this.#mqcno = mqcno;

        debug_info("MQ connection object created");
    }

    #determineSCO(mqcno) {
        let sco = null;
        if (this.#qmgrData[constants.KEY_REPOSITORY]) {
          debug_info('Key Repository has been specified');
          // *** For TLS ***
          sco = new mq.MQSCO();
          sco.KeyRepository = this.#qmgrData[constants.KEY_REPOSITORY];
          // And make the CNO refer to the SSL Connection Options
          mqcno.SSLConfig = sco;
        }
        return sco;
    }

    #getConnection() {
        return `${this.#qmgrData[constants.QM_HOST]}(${this.#qmgrData[constants.QM_PORT]})`;
    }

    #buildClientConnection(mqcno) {
        // No CCDT being used here
        // Fill in relevant fields for the MQCD
        let cd = new mq.MQCD();
        cd.ChannelName = this.#qmgrData[constants.CHANNEL];
        cd.ConnectionName = this.#getConnection();

        debug_info('Connections string is ', cd.ConnectionName);
    
        if (this.#qmgrData[constants.KEY_REPOSITORY]) {
            debug_info('Will be running in TLS Mode');
    
            // *** For TLS ***
            cd.SSLCipherSpec = this.#qmgrData[constants.CIPHER];
            cd.SSLClientAuth = MQC.MQSCA_OPTIONAL;
    
            // And make the CNO refer to the SSL Connection Options
            mqcno.SSLConfig = sco;
        }

        return cd;
    }

    #getSomeMessages(obtainedMessages, limit) {
        return new Promise((resolve, reject) => {
            debug_info("In recursive loop looking for messages");
            this.#getSingleMessage()
            .then((messageData) => {
                if (messageData) {
                    debug_info('Message is not empty')
                    obtainedMessages.push(messageData);
                    debug_info('Interim Number of messages obtained : ', obtainedMessages.length);
                    if (obtainedMessages.length < limit) {
                        this.#getSomeMessages(obtainedMessages, limit)
                        .then((result) => {
                          resolve(result);
                        })
                        .catch((err) => {
                          reject(err);
                        })
                      }
                }
                if (!messageData || obtainedMessages.length >= limit) {
                    debug_info('Resolving as enough messages found');
                    debug_info('Final Number of messages obtained : ', obtainedMessages.length);
                    resolve(obtainedMessages);
                }
            }).catch((err) => {
                debug_info("Error detected in recursive get ", err);
                reject(err);
            })
        });
    }

    #getSingleMessage() {
        debug_info("Attempting to get a single message");
        let me = this;
        return new Promise((resolve, reject) => {
            let buf = Buffer.alloc(1024);

            let mqmd = new mq.MQMD();
            let gmo = new mq.MQGMO();
      
            gmo.Options = MQC.MQGMO_NO_SYNCPOINT |
              MQC.MQGMO_NO_WAIT |
              MQC.MQGMO_CONVERT |
              MQC.MQGMO_FAIL_IF_QUIESCING;

            mq.GetSync(me.#hQueue, mqmd, gmo, buf, (err, len) => {
                if (err) {
                    if (err.mqrc == MQC.MQRC_NO_MSG_AVAILABLE) {
                        debug_info("no more messages");
                    } else {
                        debug_warn('Error retrieving message', err);
                    }
                    debug_info('Resolving null from getSingleMessage');
                    resolve(null);
                } else if (mqmd.Format == "MQSTR") {
                    // The Message from a Synchronouse GET is
                    // a data buffer, which needs to be encoded
                    // into a string, before the underlying
                    // JSON object is extracted.
                    debug_info("String data detected");
        
                    let buffString = decoder.write(buf.slice(0,len))
        
                    let msgObject = null;
                    try {
                        msgObject = JSON.parse(buffString);
                        resolve(msgObject);
                    } catch (err) {
                        debug_info("Error parsing json ", err);
                        debug_info("message <%s>", buffString);
                        resolve({'string_data' : buffString});
                    }
                } else {
                  debug_info("binary message: " + buf);
                  resolve({'binary_data' : buf});
                }
              });
        });
    }

    #closeMQConnection() {
        debug_info('Closing connection');
        let me = this;
        return new Promise(function resolver(resolve, reject) {
            if (!me.#hQueue) {
              debug_warn('Closing queue connection attempt, when queue handle not known');
              resolve();
            } else {
              mq.Close(me.#hQueue, 0, function (err) {
                if (err) {
                  me.reportError(err);
                  reject(err);
                } else {
                  debug_info("MQCLOSE successful");
                  resolve();
                }
              });
            }
          });
    }

    #disconnectFromMQ() {
        debug_info('Disconnecting');
        let me = this;
        return new Promise(function resolver(resolve, reject) {
            if (!me.#hConn) {
              debug_warn('disconnect attempt, when connection not known');
              resolve();
            } else {
              mq.Disc(me.#hConn, function (err) {
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
    
}   

// const mqConnection = new MQConnection();

module.exports = { MQConnection };
