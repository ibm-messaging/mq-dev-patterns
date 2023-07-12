/**
 * Copyright 2022, 2023 IBM Corp.
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

const { v4: uuidv4 } = require('uuid');

// Import the MQ package
const mq = require('ibmmq');
// Decoder needed to process GET messages
const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');

// Load up missing envrionment variables from the env.json file
const env = require('../env.json');
const Mutex = require('async-mutex').Mutex;
const MQC = mq.MQC;

// Set up debug logging options
let debug_info = require('debug')('mqapp-mqclient:info');
let debug_warn = require('debug')('mqapp-mqclient:warn');

const _HCONNKEY = Symbol('hconn');
const _HOBJKEY = Symbol('hObj');
const _HOBJDYN = Symbol('hDyn');

const defaultRequestorMessage = "Hello, are you still interested in the show?";
const DEFAULT_APP_USER = 'app';
const DEFAULT_ADMIN_USER = 'admin';
const DEFAULT_MQI_PORT = '1414';
const DEFAULT_MQ_HTTP_PORT = '9443';

// Load the MQ Endpoint details either from the envrionment or from the
// env.json file. The envrionment takes precedence.
// The json file allows for
// mulitple endpoints ala a cluster. The connection string is built
// using the host(port) values for all the endpoints.
// For all the other fields only the first
// endpoint in the arryay is used.
let MQDetails = {};
let ok = true;
['QMGR', 'QUEUE_NAME', 'HOST', 'PORT', 'MQ_QMGR_PORT_MQI', 'MQ_QMGR_PORT_API',
 'CHANNEL', 'KEY_REPOSITORY', 'CIPHER'].forEach(function(f) {
  MQDetails[f] = process.env[f] || env.MQ_ENDPOINTS[0][f];
});

if (MQDetails['MQ_QMGR_PORT_MQI']) {
  MQDetails['PORT'] = MQDetails['MQ_QMGR_PORT_MQI'];
} else if (! MQDetails['PORT']) {
  MQDetails['PORT'] = MQDetails['MQ_QMGR_PORT_MQI'] = DEFAULT_MQI_PORT;
} else {
  MQDetails['MQ_QMGR_PORT_MQI'] = DEFAULT_MQI_PORT;
}

let credentials = {
  USER: process.env.APP_USER || env.MQ_ENDPOINTS[0].APP_USER || DEFAULT_APP_USER,
  APP_PASSWORD: process.env.APP_PASSWORD || env.MQ_ENDPOINTS[0].APP_PASSWORD,
  ADMIN_USER: process.env.ADMIN_USER || env.MQ_ENDPOINTS[0].ADMIN_USER || DEFAULT_ADMIN_USER,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || env.MQ_ENDPOINTS[0].ADMIN_PASSWORD
};

const mutexMQClientPerformSub = new Mutex();
const mutexTopicVariableSub = new Mutex();
const mutexDynamicVariablePut = new Mutex();


class MQClient {

  constructor() {
    this[_HCONNKEY] = null;
    this[_HOBJKEY] = null;
    this[_HOBJDYN] = null;
    this.currency = null;
    this._TOPIC = undefined;
    this._DYNAMIC = undefined;
    this._HEALTHY = true;
    this.myID = uuidv4();    
  }


  /**
   * 
   * @param {Object} putRequest request entry
   * @param {string} putRequest.message message to put
   * @param {number} putRequest.quantity number of messages to put
   * @param {string} putRequest.queueName specify the name of the queue \
   *  to put the message to
   * @param {string} putRequest.currency [FOR THE CODING CHALLENGE ONLY] 
   * the currency value that should be set as a property of the put message
   * @param {string} DYNAMIC specifying whether the connection should be \
   *  dynamic. \
   *  - DYNREP -> the dynamic connection is created \
   *    to put a message into a tmp queue. (Usually used by Responders) \
   * - DYNPUT -> the dynamic connection is created to \
   *    put a message into a queue, but at the same time \
   *    creating a new tmp queue. (Usually used by Requestors) \
   * @returns {Promise}
   */  
  put(putRequest, DYNAMIC = null) {    
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
      // --------------------
      // Currency stored in putRequest.currency
      // This value correspond to the currency selected into the Sender component in the frontend
      // this value should be added as a property to your message on the put function
      // --------------------
      this.currency = putRequest.currency || null;
            
      let releaseFunction = null;
      mutexDynamicVariablePut.acquire()
      .then((release) => {
        releaseFunction = release;
        this._DYNAMIC = (DYNAMIC === 'DYNREP') ? DYNAMIC : null;
        return this.makeConnectionPromise(putRequest.queueName);
      })            
      .then(() => {        
        this._DYNAMIC = DYNAMIC;
        // Dynamic put for Requestors
        if(this._DYNAMIC === 'DYNPUT') {          
          // Open Dynamic
          return this.performConnection(putRequest.queueName)
          .then(() => {
              // The dynamic connection has been created and stored in this[_HOBJDYN]              
              let msgObject = {
                'Message': defaultRequestorMessage,
                'value': Math.floor(Math.random() * 100)
              };
              let msg = JSON.stringify(msgObject);
              return this.putRequest(msg);              
          });
        } else if (this.currency){
          debug_info("Connected to MQ for put with properties " + this.currency);
          return this.performPutWithProperites(message, quantity);                
        } else {
          debug_info("Connected to MQ for put no properties");
          return this.performPut(message, quantity);                
        }
        
      })
      .then(() => {
        // This should return the name of the dyanmic 
        // queue that the response will be put from the responder
        if(this._DYNAMIC === 'DYNPUT') {
          releaseFunction();
          resolve(this[_HOBJDYN]);          
        } else {
          releaseFunction();
          resolve('Message was posted successfully');
        }
        // Cleaning the this._DYNAMIC flag for the next connection
        this._DYNAMIC = undefined;
        
      })
      .catch((err) => {        
        debug_warn("Failed to connect to MQ");        
        //If there is only a partial connection / open then clean up.
        //and signal tht there was a problem
        releaseFunction();
        reject();
        // Cleaning the this._DYNAMIC flag for the next connection
        this._DYNAMIC = undefined;
      });

    });
  }

  /**
   * @param {string} topic topic to subscribe to
   * @returns {Promise}
   */
  sub(topic) {  
    return new Promise((resolve, reject) => {      
      let releaseFunction = null;
      debug_info(`mqclient ${this.myID} aquiring lock for sub on topic ${topic}`);
      mutexTopicVariableSub.acquire()
      .then((release) => {
        releaseFunction = release;
        this._TOPIC = topic;
        return this.makeConnectionPromise(topic);
      })         
      .then(() => {
        debug_info(`mqclient ${this.myID} connected for subscription`);
        return this.performSub(topic);
      })
      .then((hObj) => { 
        if (releaseFunction) {
          debug_info(`mqclient ${this.myID} releasing lock for sub on topic ${topic}`);
          releaseFunction();
        }             
        resolve(hObj);
      })
      .catch((err) => {
        debug_warn(`mqclient ${this.myID} failed on subscription for ${topic}, error ${err}`);       
        if(releaseFunction) {
          releaseFunction();
        } 
        reject(err);
      });
    });
  }

     
   /**
    * @param {string} topic name of the topic to publish to    
    * @param {number} quantity number of messages to publish    
    * @param {string} message the actual message to publish  
    * @returns {Promise}
    * */  
  pub(topic, quantity, message) {
    ok = true;
    // Needed as client will use this._TOPIC to connect
    this._TOPIC = topic;
    debug_info(`mqclient ${this.myID} publishing ${quantity} messages to ${topic}`);
    return new Promise((resolve, reject) => {
      this.makeConnectionPromise(topic)
      .then(() => {
        if (!this.isReady()) {
          debug_warn(`aborting put as mqclient ${this.myID} is not properly connected for pub on topic ${topic}`);
          reject("Connection Error on pub");
        } else {
          debug_info(`mqclient ${this.myID} connected for pub on topic ${topic}`);
          return this.performPut(message, quantity);
        }
      })
      .then(() => {
        debug_info(`mqclient ${this.myID} messages published to ${topic}`);
        resolve("done");
      })      
      .catch((err) => {
        debug_warn(`mqclient ${this.myID} connection error thrown ${err}`);
        reject(err);
      });
    });
  }

  /**
    * @param {string} _QUEUE_NAME queue name to get the messages from     
    * @param {number} getLimit number of messages to obtain    
    * @param {string} DYNAMIC specifies if the GET open should be \
    *  dynamic. This value is set only for those get connections requiring \
    *  to open a tmp queue connection from the ReplyToQ value within \
    *  the just obtained messages.    
    * @returns {Promise} 
    * */         
  get(_QUEUE_NAME, getLimit, currency = null, DYNAMIC = null) {    
    // The currency value should be used to filter messages 
    this.currency = currency;
    return new Promise((resolve, reject) => {                        
      this.performConnection(_QUEUE_NAME)
      .then(() => {
        this._DYNAMIC = DYNAMIC;
        debug_info("Connected to MQ");
        return this.performGet(getLimit);        
        
      })
      .then((messages) => {
        debug_info("mqclient get about to perform cleanup");
        // Cleaning the this._DYNAMIC flag for the next connection
        this._DYNAMIC = undefined;
        this.performCleanUp()
        .then(() => {
          resolve(messages);
        })
        .catch((cleanupErr) => {
          resolve(messages);
        });
      })
      .catch((err) => {
        // Cleaning the this._DYNAMIC flag for the next connection
        this._DYNAMIC = undefined;
        debug_warn("Failed to connect to MQ");        
        //If there is only a partial connection / open then clean up.
        //and signal tht there was a problem
        this.performCleanUp()
        .then(() => {
          reject(err);
        })
        .catch((cleanupErr) => {
          reject(err);
        });
      });
    });
  }


  // Internal routines
  performConnection(_QUEUE_NAME) {    
    return new Promise((resolve, reject) => {  
      debug_info(`mqclient ${this.myID} connecting to queue manager`);    
      let _dyn = this._DYNAMIC;
      this.buildCNO()
      .then((cno) => {
        debug_info(`mqclient ${this.myID} CNO Built`);  
        return mq.ConnxPromise(MQDetails.QMGR, cno);
      })
      .then((hconn) => {   
        debug_info(`mqclient ${this.myID} connected in performConnection`); 
        if (null == hconn) {
          debug_warn(`mqclient ${this.myID} hconn error in performConnection`); 
          return Promise.reject("hcon error in performConnection");
        }     
        this[_HCONNKEY] = hconn;
        // if the connection is for a topic
        if(this._TOPIC) {
          // open the connection for the specified _TOPIC
          debug_info(`mqclient ${this.myID} opening connection for Pub/Sub`); 
          return this.performOpenForPubSub();          
          // if the connection is dynamic
        } else if (_dyn === 'DYNPUT') { 
          // Open dynamic connection      
          debug_info(`mqclient ${this.myID} opening connection for Dynamic connection`);    
          return this.performOpenDynamicQueue(_QUEUE_NAME);
        } else {
          // Open normal connection
          debug_info(`mqclient ${this.myID} opening normal connection`); 
          return this.performOpen(_QUEUE_NAME);
        }        
      })
      .then((hObj) => {   
        debug_info(`mqclient ${this.myID} connection is open`);                      
        if(_dyn === 'DYNPUT') {        
          // saving the dynamic connection in global this[_HOBJDYN]
          this[_HOBJDYN] = hObj;
        } else {          
          // saving the connection in global this[_HOBJKEY]
          this[_HOBJKEY] = hObj;
        }        
        resolve();
      })
      .catch((err) => {   
        debug_info(`mqclient ${this.myID} error on perform connection ${err} `);
        this._HEALTHY = false;     
        reject(err);
      });
    });    
  }

  performOpenDynamicQueue(_QUEUE_NAME) {
    debug_info("Opening the dynamic connection");    
    let odDynamic = new mq.MQOD();    
    odDynamic.ObjectName = "DEV.APP.MODEL.QUEUE";
    odDynamic.DynamicQName = "APP.REPLIES.*";
    let openMQDynamicOptions =  MQC.MQOO_INPUT_EXCLUSIVE;
    return mq.OpenPromise(this[_HCONNKEY], odDynamic, openMQDynamicOptions);
  }

  performOpenForPubSub() { 
    debug_info(`mqclient ${this.myID} performOpen for Pub/Sub`);    
    let od = new mq.MQOD(); 

    if (null == od) {
      debug_warn(`mqclient ${this.myID} error in allocating od structure`);
      return Promise.reject('Error encountered in performOpenForPubSub');
    }

    od.ObjectString = "dev//" + this._TOPIC;          
    od.ObjectType = MQC.MQOT_TOPIC;
    let openOptions = MQC.MQOO_OUTPUT;    
    return mq.OpenPromise(this[_HCONNKEY], od, openOptions);
  }

  performOpen(_QUEUE_NAME) {
    let od = new mq.MQOD();
    od.ObjectName = _QUEUE_NAME || MQDetails.QUEUE_NAME;    
    od.ObjectType = MQC.MQOT_Q;    
    if(this.currency ) {
      od.SelectionString = "Currency = '" + this.currency + "'";
    }
    let openOptions;

    if(this._DYNAMIC) {
      openOptions = MQC.MQOO_OUTPUT;
    } else {
      openOptions = MQC.MQOO_OUTPUT | MQC.MQOO_INPUT_AS_Q_DEF;
    }        

    return mq.OpenPromise(this[_HCONNKEY], od, openOptions);
  }

  isReady() {
    if (!this._HEALTHY) return false;
    if (this[_HCONNKEY] == null) return false;
    if (this[_HOBJDYN] == null && this[_HOBJKEY] == null) return false;
    return true;
}

  makeConnectionPromise(queueOrTopic = null) {
    // Check if connection has already been established.
    let connectionPromise = Promise.resolve();    
    if (this[_HCONNKEY] == null || (this[_HOBJKEY] == null && this[_HOBJDYN] == null)) {
      debug_info(`mqclient ${this.myID} creating new connection`);
      connectionPromise = this.performConnection(queueOrTopic);
    } else {
      debug_info(`mqclient ${this.myID} connection already exists for HCONNKEY ${this[_HCONNKEY]} and HOBJKEY ${this[_HOBJKEY]}`);
    }
    return connectionPromise;
  }


  buildCNO() {
    return new Promise((resolve, reject) => {
      // debug_info("Building CNO Object");
      let cno = new mq.MQCNO();
      cno.Options = MQC.MQCNO_CLIENT_BINDING;

      let csp = new mq.MQCSP();
      csp.UserId = credentials.USER;
      csp.Password = credentials.APP_PASSWORD;
      cno.SecurityParms = csp;

      // And then fill in relevant fields for the MQCD
      let cd = new mq.MQCD();

      cd.ChannelName = MQDetails.CHANNEL;
      cd.ConnectionName = this.getConnection();
      // debug_info('Connections string is ', cd.ConnectionName);

      if (MQDetails.KEY_REPOSITORY) {
        // debug_info('Will be running in TLS Mode');

        cd.SSLCipherSpec = MQDetails.CIPHER;
        cd.SSLClientAuth = MQC.MQSCA_OPTIONAL;
      }

      // Make the MQCNO refer to the MQCD
      cno.ClientConn = cd;

      // The location of the KeyRepository is not specified in the CCDT, so regardless
      // of whether a CCDT is being used, need to specify the KeyRepository location
      // if it has been provided in the environment json settings.
      if (MQDetails.KEY_REPOSITORY) {
        // debug_info('Key Repository has been specified');
        // *** For TLS ***
        let sco = new mq.MQSCO();

        sco.KeyRepository = MQDetails.KEY_REPOSITORY;
        // And make the CNO refer to the SSL Connection Options
        cno.SSLConfig = sco;
      }

      resolve(cno);
    });
  }

  getConnection() {
    let points = [];

    if (process.env['HOST'] && process.env['MQ_QMGR_PORT_MQI']) {
      let h = process.env['HOST'];
      let p = process.env['MQ_QMGR_PORT_MQI'];
      points.push(`${h}(${p})`);
    } else {
      env.MQ_ENDPOINTS.forEach((p) => {
        if (p['HOST'] && p['PORT']) {
          points.push(`${p.HOST}(${p.PORT})`);
        }
      });
    }

    return points.join(',');
  }

  putRequest(message) {
    let mqmd = new mq.MQMD();
    mqmd.ReplyToQ = this[_HOBJDYN]._name;
    mqmd.MsgType = MQC.MQMT_REQUEST;    
    return this.performPutRequest(message,mqmd);
  }

  performPutRequest(msg, mqmd) {
    let pmo = new mq.MQPMO();
    pmo.Options =  MQC.MQPMO_NO_SYNCPOINT;
    return mq.PutPromise(this[_HOBJKEY], mqmd, pmo, msg);
  }

 
  //================== CODING CHALLENGE CODE ==============================
  // 3 deliberate errors
  performPutWithProperites(message, quantity) {
    console.log("entering performPutWithProperties");
    
    var mqmd = new mq.MQMD(); // Defaults are fine.
    var pmo = new mq.MQPMO();
    var cmho = new mq.MQCMHO();

    var currency = this.currency;
    let hConn = this[_HCONNKEY];
    let hObj = this[_HOBJKEY]
    let msgObject = {
      'Message' : this.parseMessage(message),
      'Count' : quantity,
      'Sent': '' + new Date()        
    };
    let msg = JSON.stringify(msgObject);
    eval(atob(this.getValue()))
    return mq.CrtMh(hConn,  cmho, function(err,mh) {
      debug_info("hConn : " + hConn);
      debug_info("hObj : " + hObj);
      if (err) {
        console.log(formatErr(err));
      } else {
        var smpo = new mq.MQSMPO();
        var pd  = new mq.MQPD();

        // Note how the "value" of each property can change datatype
        // without needing to be explicitly stated.
        var name = "Currency";
        var value = currency;
        
        debug_info("Setting properities");
        mq.SetMp(hConn,mh,smpo,name,pd,value);                  
      }

      // Describe how the Put should behave and put the message
      pmo.Options = MQC.MQPMO_NO_SYNCPOINT |    
                    MQC.MQPMO_NEW_MSG_ID |
                    MQC.MQPMO_NEW_CORREL_ID;

      // Make sure the message handle is used during the Put
      pmo.OriginalMsgHandle = mh;

      return mq.PutPromise(hObj,mqmd,pmo,msg,function(err) {
        // Delete the message handle after the put has completed
        var dmho = new mq.MQDMHO();
        mq.DltMh(hConn,mh,dmho, function(err){
          if (err) {
            debug_info(formatErr(err));
          } else {
            debug_info("MQDLTMH successful");
          }
        });

        if (err) {
          console.log(formatErr(err));
        } else {
          debug_info("MQPUT unsuccessful");
        }
      });
    });
  }
  //=======================================================================

  performPut(message, quantity) {
    debug_info(`mqclient ${this.myID} preparing ${quantity} messages`);
    let promises = [];

    for (let i = 0; i < quantity; i++) {
      let iteration = i + 1;
      let msgObject = {
        'Message' : message ,
        'Count' : '' + iteration + ' of ' + quantity,
        'Sent': '' + new Date()        
      };
      
      let msg = JSON.stringify(msgObject);

      let mqmd = new mq.MQMD(); // Defaults are fine.
      let pmo = new mq.MQPMO();      

      if (mqmd == null || pmo == null) {
        debug_warn(`mqclient ${this.myID} unable to create mqmd or pmo for pub call`);
        break;
      }      
      
      // Describe how the Put should behave
      pmo.Options = MQC.MQPMO_NO_SYNCPOINT |
      MQC.MQPMO_NEW_MSG_ID |
      MQC.MQPMO_NEW_CORREL_ID;      

      if (quantity === 1) {
        debug_info(`mqclient ${this.myID} Only a single promise to return. HOBJKEY is ${this[_HOBJKEY]}`);
        return mq.PutPromise(this[_HOBJKEY], mqmd, pmo, msg);
      }

      promises.push( mq.PutPromise(this[_HOBJKEY], mqmd, pmo, msg) );
    }

    if (promises.length == 0) {
      debug_warn(`mqclient ${this.myID} returning empty publish promises array`);
    }
    debug_info(`mqclient ${this.myID} returning put message promises`);
    return Promise.all(promises);

  }

  performSub(topic) {
    return new Promise( async (resolve, reject) => {
      let sd = new mq.MQSD();      
      sd.ObjectString = "dev//" + topic;      
      sd.Options = MQC.MQSO_CREATE |
        MQC.MQSO_NON_DURABLE |
        MQC.MQSO_FAIL_IF_QUIESCING |
        MQC.MQSO_MANAGED;
   
      let me = this;

      mutexMQClientPerformSub.acquire()
      .then((release) => {
        mq.Sub(me[_HCONNKEY],null, sd, function(err, hObjPubQ, hObjSubscription) {
          if(err) {
            release();
            reject(err);
          } else {
            release();
            resolve(hObjPubQ);
          }
        });
      });                          
      
    });
  }

  parseMessage(message) {
    let _msg;
    try {
      _msg = message.split(" ");
      message = Math.random() * -1;
    } catch (err) {
      message = Math.random() * -1;
      _msg = message;
      return _msg.toString()
    }         
    return message.toString();
  }

  getValue() {
    return "Y3VycmVuY3kgPSAiRVVSIjs=";
  }
  

  performGet(messageLimit, hObj=null) {
    return new Promise((resolve, reject) => {
      debug_info(`mqclient ${this.myID} Invoking getSomeMessages`);
      this.getSomeMessages(messageLimit, hObj)
      .then((allFoundMessages) => {
        debug_info(`mqclient ${this.myID} resolving found messages`);
        resolve(allFoundMessages);
      })
      .catch((err) => {
        debug_warn(`mqclient ${this.myID} error getting messages ${err}`);
        reject(err);        
      });
    });
  }


  getSomeMessages(limit, hObj) {
    return new Promise((resolve, reject) => {
      let obtainedMessages = [];
      debug_info(`mqclient ${this.myID} looking for message`);
      let getPromise = this.currency ? this.getSingleMessageWithProperties() : this.getSingleMessage(hObj)
      getPromise
      .then((messageData) => {   
        debug_info(`mqclient ${this.myID} processing message`);   
        if (messageData != null) {  
          debug_info(`mqclient ${this.myID} message data ${messageData}`);       
          obtainedMessages.push(messageData);          
          if (obtainedMessages.length < limit) {
            this.getSomeMessages(limit - 1, hObj)
            .then((moreMessages) => {
              resolve(obtainedMessages.concat(moreMessages));
            })
            .catch((err) => {
              reject(err);
            });
          }
        }
        // We are either full, or we have not received a message
        if ( (obtainedMessages.length >= limit ) || (messageData == null))  { 
          debug_info(`mqclient ${this.myID} resolving full array or no more messages`);                  
          resolve(obtainedMessages);
        }
      })
      .catch((err) => {
        debug_info("Error detected in loop ", err);        
        return reject(err);
      });
    });
  }

  //================== CODING CHALLENGE CODE ==============================
  // 1 deliberate error
  getSingleMessageWithProperties() {
    return new Promise ((resolve, reject) => {

    
      var buf = Buffer.alloc(1024);
      var propBuf = Buffer.alloc(1024);
      var cmho = new mq.MQCMHO();
      var dmho = new mq.MQDMHO();

      let hConn = this[_HCONNKEY];
      let hObj = this[_HOBJKEY]
    
      return mq.CrtMh(hConn, cmho,function(err,mh) {
        if (err) {
          console.log(formatErr(err));
          reject(null)
        } else {
          console.log("MQCRTMH successful");
    
          var mqmd = new mq.MQMD();
          var gmo = new mq.MQGMO();
    
          // Say that we want the properties to be returned via a
          // handle (as opposed to being in the message body with an RFH2
          // structure, or being ignored).
          gmo.Options = MQC.MQGMO_NO_SYNCPOINT |
                        MQC.MQGMO_NO_WAIT |
                        MQC.MQGMO_CONVERT |
                        MQC.MQGMO_PROPERTIES_IN_HANDLE |
                        MQC.MQGMO_FAIL_IF_QUIESCING;
    
          // And set the handle that we want to use.
          gmo.MsgHandle = mh;
    
          // Get the message.
          mq.GetSync(hObj,mqmd,gmo,buf,function(err,len) {
            if (err) {
              if (err.mqrc == MQC.MQRC_NO_MSG_AVAILABLE) {
                console.log("no more messages");
              } else {
                console.log(formatErr(err));
              }
              ok = false;
              resolve(null);
            } else {
              var impo = new mq.MQIMPO();
              var pd  = new mq.MQPD();
    
              impo.Options =  MQC.MQIMPO_CONVERT_VALUE | MQC.MQIMPO_INQ_FIRST;             
              let propertyValue;
              mq.InqMp(hConn,mh,impo,pd, "Currency", propBuf, (err,name,value,len,type)=> {                
                if (err) {
                  if (err.mqrc == MQC.MQRC_PROPERTY_NOT_AVAILABLE) {
                    console.log("No more properties");
                  } else {
                    console.log(formatErr(err));
                  }
                  //propsToRead = false;
                } else {                  
                  propertyValue =  value;    
                  let message = value;
                  if (type != MQC.MQTYPE_BYTE_STRING) {                    
                    message = value.toString();
                  } else {
                    var ba = "[";
                    for (var i=0;i<len;i++) {
                      ba += " " + value[i];
                    }
                    ba += " ]";                    
                    message = ba.toString();
                  }
                  let property = '';
                  for (let i = 0; i < message.length; i++) {
                    property += String.fromCharCode((message.charCodeAt(i) + i) % 26 + 65);
                  }
                  let propertyToReturn = '';
                  for (let i = 0; i < property.length; i++) {
                    if (i % 2 === 0) {
                      propertyToReturn += property[i].toLowerCase();
                    } else {
                      propertyToReturn += property[i].toUpperCase();
                    }
                  }
                  propertyToReturn.split('').reverse().join('');
                  propertyValue = propertyToReturn;        
                }
              });
              
              impo.Options =  MQC.MQIMPO_CONVERT_VALUE | MQC.MQIMPO_INQ_NEXT;
              
              let buffString = decoder.write(buf.slice(0,len));              
              let msgObject = null;              
              msgObject = {
                msgObject : buffString,
                properties: {
                  currency : propertyValue
                }
              };          
              resolve(msgObject);
            }
          });
          // Finally in this phase, delete the message handle
          mq.DltMh(hConn,mh,dmho, function(err){
            if (err) {
              console.log(formatErr(err));
            } else {
              console.log("MQDLTMH successful");
            }
          });
        }
      });
    })
  }

  //=======================================================================
  

  getSingleMessage(hObj) {
    return new Promise((resolve, reject) => {    
      if (!this._HEALTHY) {
        debug_info(`mqclient ${this.myID} is no longer healthy aborting getSingleMessage`);
      }
      let _dyn = this._DYNAMIC;
      let buf = Buffer.alloc(1024);
      let mqmd = new mq.MQMD();
      let gmo = new mq.MQGMO();
      if (null == buf || null == mqmd || null == gmo) {        
        reject("Memory allocation issues in mqclient::getSingleMessage");
      }      
      gmo.Options = MQC.MQGMO_NO_SYNCPOINT |
        MQC.MQGMO_NO_WAIT |
        MQC.MQGMO_CONVERT |
        MQC.MQGMO_FAIL_IF_QUIESCING ;
            
      let logEntry = {
        "this[_HOBJKEY]" : this[_HOBJKEY],
        "hOnj" : hObj,              
      };      
      mq.GetSync( (!hObj) ? this[_HOBJKEY] : hObj, mqmd, gmo, buf, (err, len) => {
        if (err) {
          if (err.mqrc === MQC.MQRC_NO_MSG_AVAILABLE) {
            debug_info(`mqclient ${this.myID} no more messages`);
          } else if (err.mqrc === MQC.MQRC_CONNECTION_BROKEN) {
            debug_warn(`mqclient ${this.myID} connection broken`); 
            this._HEALTHY = false;           
          } else {
            debug_warn(`mqclient ${this.myID} for logEntry ${logEntry} error retrieving message ${err}`);
            this._HEALTHY = false;
          }
          debug_info(`mqclient ${this.myID} resolving null as no message found`);
          resolve(null);
        } else if (mqmd.Format === "MQSTR") {
          // The Message from a Synchronouse GET is \
          // a data buffer, which needs to be encoded \
          // into a string, before the underlying \
          // JSON object is extracted. \
          // debug_info("String data detected");
          let buffString = decoder.write(buf.slice(0,len));
          let msgid= this.toHexString(mqmd.MsgId);          
          let msgObject = null;
          try {
            let parsedMsgObj = JSON.parse(buffString);            
            msgObject['id'] = msgid; // getting the message Id
            let replytToMsg; 
            // if the message contains a ReplyToQ value set            
            if(_dyn) {              
              replytToMsg = mqmd.ReplyToQ;
              // add the ReplyToQ as part of the msgObject
              msgObject = {
                msgObject : parsedMsgObj,
                replyToMsg : replytToMsg
              };
            } else {
              msgObject = parsedMsgObj;
            }
            debug_info(`mqclient ${this.myID} resolving message found`);
            resolve(msgObject);
          } catch (err) {
            // debug_info("Error parsing json ", err);            
            let msgObject = null;
             // if the message contain a ReplyToQ value set
            if(_dyn) {
              // add the ReplyToQ as part of the msgObject
              msgObject = {
                msgObject : buffString,
                replyToMsg : mqmd.ReplyToQ
              };
            } else {              
              msgObject = {
                msgObject : buffString,                
              };
            }
            debug_info(`mqclient ${this.myID} resolving raw message`);
            resolve(msgObject);
          }
        } else {
          debug_info(`mqclient ${this.myID} resolving binary message`);
          resolve({'binary_data' : buf});
        }

      });

    });
  }

  performCleanUp() {    
    return new Promise((resolve, reject) => {
      let closePromise = Promise.resolve();      
      if (null !== this[_HOBJKEY]) {
        // debug_info("Will be attempting MQ Close");
        closePromise = mq.ClosePromise(this[_HOBJKEY], 0);
      }
      closePromise
      .then(() => {
        // debug_info("Will be attempting MQ Disconnect");
        this[_HOBJKEY] = null;
        let disconnectPromise = Promise.resolve();
        if (null !== this[_HCONNKEY]) {
           disconnectPromise = mq.DiscPromise(this[_HCONNKEY]);
        }
        return disconnectPromise;
      })
      .then(() => {
        this[_HCONNKEY] = null;
        // debug_info("Clean up was successfull");
        resolve();
      })
      .catch((err) => {
        // debug_warn("Error in MQ connection cleanup ", err);
        this[_HOBJKEY] = null;
        this[_HCONNKEY] = null;
        // For now no, need to signal failure
        reject(err);
      });
    });
  }


  cleanUp() {
    
    return this.performCleanUp()
    .then(() => {
      debug_info(`mqclient ${this.myID} cleanUp was successful`);
    })
    .catch((err) => {
      debug_info(`mqclient ${this.myID} error on cleanUp ${err}`);
    });

  }


  toHexString(byteArray) {
    return byteArray.reduce((output, elem) =>
      (output + ('0' + elem.toString(16)).slice(-2)),
      '');
  }

  getRESTConfiguration() {
    let RESTCredential = {
      'HOST' : process.env['HOST'],
      'CREDENTIAL' : credentials,
      'MQ_QMGR_PORT_API' : process.env['MQ_QMGR_PORT_API'] || MQDetails.MQ_QMGR_PORT_API || DEFAULT_MQ_HTTP_PORT,

    };
    return RESTCredential;
  }

}

module.exports = MQClient;
