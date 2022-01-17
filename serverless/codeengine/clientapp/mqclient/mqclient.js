/**
 * Copyright 2021 IBM Corp.
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

// Import the MQ package
const mq = require('ibmmq');

// Decoder needed to process GET messages
const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');

// Load up missing envrionment variables from the env.json file
const env = require('../env.json');

var MQC = mq.MQC;

// Set up debug logging options
let debug_info = require('debug')('mqapp-mqclient:info');
let debug_warn = require('debug')('mqapp-mqclient:warn');

const _HCONNKEY = Symbol('hconn');
const _HOBJKEY = Symbol('hObj');

const BROWSEWAITINTERVAL = 10 * 1000; // 10 seconds


// Load the MQ Endpoint details either from the envrionment or from the
// env.json file. The envrionment takes precedence.
// The json file allows for
// mulitple endpoints ala a cluster. The connection string is built
// using the host(port) values for all the endpoints.
// For all the other fields only the first
// endpoint in the arryay is used.
var MQDetails = {};

['QMGR', 'QUEUE_NAME', 'HOST', 'PORT', 'MQ_PORT',
 'CHANNEL', 'KEY_REPOSITORY', 'CIPHER'].forEach(function(f) {
  MQDetails[f] = process.env[f] || env.MQ_ENDPOINTS[0][f]
});

if (MQDetails['MQ_PORT']) {
  MQDetails['PORT'] = MQDetails['MQ_PORT'];
}

var credentials = {
  USER: process.env.APP_USER || env.MQ_ENDPOINTS[0].APP_USER,
  PASSWORD: process.env.APP_PASSWORD || env.MQ_ENDPOINTS[0].APP_PASSWORD
};


class MQClient {

  constructor() {
    this[_HCONNKEY] = null;
    this[_HOBJKEY] = null;
  }

  check() {
    debug_info("MQ Client Check function invoked");
  }

  // External faceing functions
  put(putRequest) {
    return new Promise((resolve, reject) => {
      let message = 'Message from app running in Cloud Engine';
      let quantity = 1;
      if (putRequest) {
        if (putRequest.message) {
          message = putRequest.message;
        }
        if (putRequest.quantity) {
          quantity = putRequest.quantity;
        }
      }

      debug_info("Will be putting message ", message);

      this.makeConnectionPromise()
      .then(() => {
        debug_info("Connected to MQ");
        return this.performPut(message, quantity);
      })
      .then(() => {
        debug_info("Message Posted");
        resolve('Message was posted successfully');
      })
      .catch((err) => {
        debug_warn("Failed to connect to MQ");
        debug_info(err);
        //If there is only a partial connection / open then clean up.
        //and signal tht there was a problem
        this.performCleanUp()
        .then(() => {
          reject(err)
        })
        .catch((cleanupErr) => {
          reject(err);
        })
      });

    });
  }


  get(getLimit) {
    return new Promise((resolve, reject) => {
      debug_info("Will be getting messages ");
      this.makeConnectionPromise()
      .then(() => {
        debug_info("Connected to MQ");
        return this.performGet(getLimit);
      })
      .then((messages) => {
        debug_info("Messages Obtained");
        resolve(messages);
      })
      .catch((err) => {
        debug_warn("Failed to connect to MQ");
        debug_info(err);
        //If there is only a partial connection / open then clean up.
        //and signal tht there was a problem
        this.performCleanUp()
        .then(() => {
          reject(err)
        })
        .catch((cleanupErr) => {
          reject(err);
        })
      })
    });
  }

  browse() {
    return new Promise((resolve, reject) => {
      this.makeConnectionPromise()
      .then(() => {
        debug_info("Connected to MQ");
        return this.performBrowse();
      })
      .then((msgData) => {
        resolve(msgData);
      })
      .catch((err) => {
        reject(err);
      })
    });
  }

  getById(msgid) {
    return new Promise((resolve, reject) => {
      this.makeConnectionPromise()
      .then(() => {
        debug_info("Connected to MQ");
        debug_info("Looking for : ", msgid);
        return this.performGetById(msgid);
      })
      .then((msg) => {
        if (msg) {
          debug_info('Message Found ', msg);
          resolve(msg);
        } else {
          debug_warn('No Message found');
          reject("No Message with specified id found")
        }
        resolve(msg);
      })
      .catch((err) => {
        debug_info('Error obtaining message by id ', err);
        reject(err);
      })
    });
  }


  // Internal routines

  performConnection() {
    return new Promise((resolve, reject) => {
      this.buildCNO()
      .then((cno) => {
        debug_info("CNO Built");
        return mq.ConnxPromise(MQDetails.QMGR, cno);
      })
      .then((hconn) => {
        debug_info("Connected to MQ");
        this[_HCONNKEY] = hconn;
        return this.performOpen();
      })
      .then((hObj) => {
        debug_info("MQ Queue is open");
        this[_HOBJKEY] = hObj;
        resolve();
      })
      .catch((err) => {
        debug_warn("Error establising connection to MQ");
        debug_warn(err);
        reject(err);
      });
    });
    debug_info("Establishing Connection to MQ");
  }

  performOpen() {
    let od = new mq.MQOD();
    od.ObjectName = MQDetails.QUEUE_NAME;
    od.ObjectType = MQC.MQOT_Q;

    let openOptions = MQC.MQOO_OUTPUT | MQC.MQOO_INPUT_AS_Q_DEF | MQC.MQOO_BROWSE;

    return mq.OpenPromise(this[_HCONNKEY], od, openOptions);
  }


  makeConnectionPromise() {
    // Check if connection has already been established.
    let connectionPromise = Promise.resolve();
    if (this[_HCONNKEY] === null || this[_HOBJKEY] === null) {
      connectionPromise = this.performConnection();
    }
    return connectionPromise;
  }


  buildCNO() {
    return new Promise((resolve, reject) => {
      debug_info("Building CNO Object");
      let cno = new mq.MQCNO();
      cno.Options = MQC.MQCNO_CLIENT_BINDING;

      let csp = new mq.MQCSP();
      csp.UserId = credentials.USER;
      csp.Password = credentials.PASSWORD;
      cno.SecurityParms = csp;

      // And then fill in relevant fields for the MQCD
      var cd = new mq.MQCD();

      cd.ChannelName = MQDetails.CHANNEL;
      cd.ConnectionName = this.getConnection();
      debug_info('Connections string is ', cd.ConnectionName);

      if (MQDetails.KEY_REPOSITORY) {
        debug_info('Will be running in TLS Mode');

        cd.SSLCipherSpec = MQDetails.CIPHER;
        cd.SSLClientAuth = MQC.MQSCA_OPTIONAL;
      }

      // Make the MQCNO refer to the MQCD
      cno.ClientConn = cd;

      // The location of the KeyRepository is not specified in the CCDT, so regardless
      // of whether a CCDT is being used, need to specify the KeyRepository location
      // if it has been provided in the environment json settings.
      if (MQDetails.KEY_REPOSITORY) {
        debug_info('Key Repository has been specified');
        // *** For TLS ***
        var sco = new mq.MQSCO();

        sco.KeyRepository = MQDetails.KEY_REPOSITORY;
        // And make the CNO refer to the SSL Connection Options
        cno.SSLConfig = sco;
      }

      resolve(cno);
    });
  }


  getConnection() {
    let points = [];

    if (process.env['HOST'] && process.env['MQ_PORT']) {
      let h = process.env['HOST'];
      let p = process.env['MQ_PORT'];
      points.push(`${h}(${p})`)
    } else {
      env.MQ_ENDPOINTS.forEach((p) => {
        if (p['HOST'] && p['PORT']) {
          points.push(`${p.HOST}(${p.PORT})`)
        }
      });
    }

    return points.join(',');
  }


  performPut(message, quantity) {
    var promises = [];

    for (let i = 0; i < quantity; i++) {
      let iteration = i + 1;
      let msgObject = {
        'Message' : message,
        'Count' : '' + iteration + ' of ' + quantity,
        'Sent': '' + new Date()
      }
      let msg = JSON.stringify(msgObject);

      var mqmd = new mq.MQMD(); // Defaults are fine.
      var pmo = new mq.MQPMO();

      // Describe how the Put should behave
      pmo.Options = MQC.MQPMO_NO_SYNCPOINT |
        MQC.MQPMO_NEW_MSG_ID |
        MQC.MQPMO_NEW_CORREL_ID;

      promises.push( mq.PutPromise(this[_HOBJKEY], mqmd, pmo, msg) );
    }
    return Promise.all(promises);
  }

  performGet(messageLimit) {
    return new Promise((resolve, reject) => {
      let obtainedMessages = [];
      this.getSomeMessages(obtainedMessages, messageLimit)
      .then((allFoundMessages) => {
        debug_info("replying from performGet");
        resolve(allFoundMessages);
      })
      .catch((err) => {
        reject(err);
      })
    });
  }

  getSomeMessages(obtainedMessages, limit) {
    return new Promise((resolve, reject) => {
      debug_info("In recursive loop looking for messages");

      this.getSingleMessage()
      .then((messageData) => {
        debug_info('Message obtained');
        if (messageData) {
          debug_info('Message is not empty')
          obtainedMessages.push(messageData);
          debug_info('Interim Number of messages obtained : ', obtainedMessages.length);
          if (obtainedMessages.length < limit) {
            this.getSomeMessages(obtainedMessages, limit)
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
      })
      .catch((err) => {
        debug_info("Error detected in loop ", err);
        return reject(err);
      });
    });
  }


  getSingleMessage() {
    return new Promise((resolve, reject) => {
      let buf = Buffer.alloc(1024);

      let mqmd = new mq.MQMD();
      let gmo = new mq.MQGMO();

      gmo.Options = MQC.MQGMO_NO_SYNCPOINT |
        MQC.MQGMO_NO_WAIT |
        MQC.MQGMO_CONVERT |
        MQC.MQGMO_FAIL_IF_QUIESCING;

      mq.GetSync(this[_HOBJKEY], mqmd, gmo, buf, (err, len) => {
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


  performGetById(msgid) {
    return new Promise((resolve, reject) => {
      let buf = Buffer.alloc(1024);

      let mqmd = new mq.MQMD();
      let gmo = new mq.MQGMO();

      gmo.Options = MQC.MQGMO_NO_SYNCPOINT |
        MQC.MQGMO_NO_WAIT |
        MQC.MQGMO_CONVERT |
        MQC.MQGMO_FAIL_IF_QUIESCING;

      gmo.MatchOptions = MQC.MQMO_MATCH_MSG_ID;
      mqmd.MsgId = this.hexToBytes(msgid);

      mq.GetSync(this[_HOBJKEY], mqmd, gmo, buf, (err, len) => {
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




  performCleanUp() {
    return new Promise((resolve, reject) => {
      let closePromise = Promise.resolve();
      if (null !== this[_HOBJKEY]) {
        debug_info("Will be attempting MQ Close");
        closePromise = mq.ClosePromise(this[_HOBJKEY], 0);
      }
      closePromise
      .then(() => {
        debug_info("Will be attempting MQ Disconnect");
        this[_HOBJKEY] = null;
        let disconnectPromise = Promise.resolve();
        if (null !== this[_HCONNKEY]) {
           disconnectPromise = mq.DiscPromise(this[_HCONNKEY]);
        }
        return disconnectPromise;
      })
      .then(() => {
        this[_HCONNKEY] = null;
        debug_info("Clean up was successfull");
        resolve();
      })
      .catch((err) => {
        debug_warn("Error in MQ connection cleanup ", err);
        this[_HOBJKEY] = null;
        this[_HCONNKEY] = null;
        // For now no, need to signal failure
        reject(err);
      })
    });
  }

  performBrowse() {
    return new Promise((resolve, reject) => {
      let buf = Buffer.alloc(1024);

      let mqmd = new mq.MQMD();
      let gmo = new mq.MQGMO();

      gmo.Options = MQC.MQGMO_NO_SYNCPOINT |
        MQC.MQGMO_NO_WAIT |
        MQC.MQGMO_CONVERT |
        MQC.MQGMO_FAIL_IF_QUIESCING;

        gmo.Options |= MQC.MQGMO_BROWSE_FIRST;

        gmo.MatchOptions = MQC.MQMO_NONE;
        gmo.WaitInterval = BROWSEWAITINTERVAL;

      mq.GetSync(this[_HOBJKEY], mqmd, gmo, buf, (err, len) => {
        if (err) {
          if (err.mqrc == MQC.MQRC_NO_MSG_AVAILABLE) {
            debug_info("no more messages");
          } else {
            debug_warn('Error retrieving message', err);
          }
          debug_info('Resolving null from getSingleMessage');
          resolve(null);
        } else {
          debug_info("Message Found");

          let msgData = {
            'Buffer Array' : {
              'MsgId' : mqmd.MsgId,
              'CorrelId' : mqmd.CorrelId
            },
            'HexStrings' : {
              'MsgId' : this.toHexString(mqmd.MsgId),
              'CorrelId' : this.toHexString(mqmd.CorrelId)
            }
          }

          debug_info('Message Header retrieved: ', msgData);
          resolve(msgData);
        }
      });
    });
  }


  toHexString(byteArray) {
    return byteArray.reduce((output, elem) =>
      (output + ('0' + elem.toString(16)).slice(-2)),
      '');
  }

  hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
  }


}

module.exports = MQClient;
