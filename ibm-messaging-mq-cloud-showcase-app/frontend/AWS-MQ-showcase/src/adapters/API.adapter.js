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

import axios from 'axios';


const END_POINT_GET_DEPTHS =  '/api/qdepth';
const END_POINT_PUT =  '/api/mqput';
const END_POINT_GET =  '/api/mqget?limit=';
const END_POINT_PUB =  '/api/pub';
const END_POINT_SUB =  '/api/sub';
const END_POINT_UNSUB =  '/api/unsub';
const END_POINT_GETLASTMESSAGEFORSUB =  '/api/getLastMessage';
const END_POINT_DYNPUT =  '/api/putReq';
const END_POINT_GETDYN =  '/api/getRes?'; 
const END_POINT_GET_CODING_CHALLENGE = '/api/getCodingChallange?limit='
const END_POINT_CLOSE_CONSUMER_CONNECTION = '/api/closeConsumer';
const END_POINT_CLOSE_PRODUCER_CONNECTION = '/api/closeProducer';

class APIAdapter {

  async closeProducer() {
    let result;
    try {
      result = await axios.get(END_POINT_CLOSE_PRODUCER_CONNECTION);      
    } catch (err) {
      result = err;
    }    
    return result;
  }
  
  async closeConsumer(consumerId) {
    let result;

    try{
      let URL = END_POINT_CLOSE_CONSUMER_CONNECTION + `?consumerId=${consumerId}`;
      result = await axios.get(URL)
    } catch(err) {
      result = err;
    }

    return result;
  }
  async getAllDepths(isForSubs) {
    let result = undefined;
    try {
      var _endPoint =
        END_POINT_GET_DEPTHS + (isForSubs ? '?isForSubs=' + isForSubs : '');
      let _result = await axios.get(_endPoint);
      result = _result.data;
    } catch (e) {
      console.log(e);
      let errorStatus = e.response.status;
      if(errorStatus === 525) {
        result = errorStatus;
      } else {
        result = 505
      }    
    }

    return result;
  }

  put(message, quantity, queueName, currency =  null) {
    return axios({
      method: 'post',
      url: END_POINT_PUT,
      data: {
        message: message,
        quantity: quantity,
        queueName: queueName,
        currency: currency
      },
    });
  }

  async getFromLimit(limit, queueName) {
    let result = undefined;
    try {
      let URL = END_POINT_GET + limit + '&queueName=' + queueName;
      let _result = await axios.get(URL);      
      result = JSON.parse(_result.data[0].msgObject);
    } catch (e) {
      //console.log('Error on getting messages');
    }

    return result;
  }
  
  async getFromLimitCodingChallange(limit, queueName, currency_, consumerId) {
    let result = undefined;
    try {
      let URL = END_POINT_GET_CODING_CHALLENGE + limit + '&queueName=' + queueName + '&currency=' + currency_ + '&consumerId=' + consumerId;
      let _result = await axios.get(URL);            
      let message = JSON.parse(_result.data[0].msgObject);
      let currency = _result.data[0].properties.currency;
      result = {
        message : message,
        currency : currency
      }            
    } catch (e) {
      //console.log('Error on getting messages');
    }

    return result;
  }

  async getForSubFromAppId(appId, topic = null) {
    try {
      let result = undefined;

      let _result = await axios({
        method: 'post',
        url: END_POINT_GETLASTMESSAGEFORSUB,
        data: {
          appId: appId,
          topic: topic,
        },
      });

      // this means that instead of getting the last message
      // the subscription happened;

      if (parseInt(_result.status) === 250) {                
        result = -1;
      } else {
        let data = _result.data;

        if (data?._lastMessage?.length > 0) {
          let body = JSON.parse(data._lastMessage[0].msgObject);

          let messageValues = body.Message.split('|@|');
          let title = messageValues[0];
          let message = messageValues[1];
          let id = body.id;
          let count = body.Count;
          let date = body.Sent.substring(0, 25);
          result = {
            Title: title,
            Message: message,
            Count: count,
            Date: date,
            id: id,
          };
        }
      }

      return result;
    } catch (e) {
      // console.log('Error on getting the last messages for ' + appId);
      return undefined;
    }
  }

  subscribe(appId, topic) {
    try {
      return axios({
        method: 'post',
        url: END_POINT_SUB,
        data: {
          appId: appId,
          topic: topic,
        },
      });
    } catch (e) {
      console.log('Error on updating subscrisber ');
    }
  }

  unsubscribe(appId) {
    try {
      return axios.get(END_POINT_UNSUB + '?appId=' + appId);
    } catch (e) {
      console.log('Error on updating subscribers ');
    }
  }

  async publish(message, quantity, topic, appId) {
    let res = await axios({
      method: 'post',
      url: END_POINT_PUB,
      data: {
        message: message,
        quantity: quantity,
        topic: topic,
        appId: appId
      },
    });
    return res;
  }

  async dynPut(msg, quantity, queueName, type, appId, sessionID=null) {
    try {
      let result = undefined;

      let _result = await axios({
        method: 'post',
        url: END_POINT_DYNPUT,
        data: {
          message: msg,
          quantity: quantity,
          queueName: queueName,
          type: type,
          appId: appId,
          sessionID : sessionID
        },
      });

      if (parseInt(_result.status) === 200) {
        result = _result.data;
      } else {
        result = -1;
      }
      return result;
    } catch (e) {
      // console.log('Error on getting the last messages for ' + appId);
      return undefined;
    }
  }

  async getDyn(limit, queueName, appId, type) {
    let result = undefined;
    try {
      let URL =
        END_POINT_GETDYN +
        `limit=${limit}&queueName=${queueName}&appId=${appId}&type=${type}`;
      let _result = await axios.get(URL);
      if (type !== 'DYNPUT') {
        let msg = JSON.parse(_result.data[0].msgObject);
        let replyQueue = _result.data[0].replyToMsg;
        result = {
          message: msg,
          replyQueue: replyQueue,
        };
      } else {
        result = JSON.parse(_result.data.msgObject).Message;
      }

      return result;
    } catch (e) {
      //console.log('Error on getting messages');
    }
  }
}

export default APIAdapter;
