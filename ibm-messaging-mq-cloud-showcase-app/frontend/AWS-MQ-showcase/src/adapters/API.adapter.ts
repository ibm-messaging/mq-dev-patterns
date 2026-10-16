/**
 * Copyright 2022, 2026 IBM Corp.
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
import type {
  QueueDepth,
  MQMessage,
  CodingChallengeResult,
  SubMessage,
  DynPutResult,
  DynGetResult,
} from '../types';

const be = import.meta.env.VITE_BE_HOST;
const be_port = import.meta.env.VITE_BE_PORT;
const be_tls = import.meta.env.VITE_BE_TLS;
const HTTP_PROTOCOL = be_tls ? 'https://' : 'http://';

let be_host = '';

if (be) {
  be_host = HTTP_PROTOCOL + be + ':' + be_port;
}

const END_POINT_GET_DEPTHS = be_host + '/api/qdepth';
const END_POINT_PUT = be_host + '/api/mqput';
const END_POINT_GET = be_host + '/api/mqget?limit=';
const END_POINT_PUB = be_host + '/api/pub';
const END_POINT_SUB = be_host + '/api/sub';
const END_POINT_UNSUB = be_host + '/api/unsub';
const END_POINT_GETLASTMESSAGEFORSUB = be_host + '/api/getLastMessage';
const END_POINT_DYNPUT = be_host + '/api/putReq';
const END_POINT_GETDYN = be_host + '/api/getRes?';
const END_POINT_GET_CODING_CHALLENGE =
  be_host + '/api/getCodingChallange?limit=';
const END_POINT_CLOSE_CONSUMER_CONNECTION = be_host + '/api/closeConsumer';
const END_POINT_CLOSE_PRODUCER_CONNECTION = be_host + '/api/closeProducer';

class APIAdapter {
  async closeProducer(): Promise<unknown> {
    try {
      return await axios.get(END_POINT_CLOSE_PRODUCER_CONNECTION);
    } catch (err) {
      return err;
    }
  }

  async closeConsumer(consumerId: string): Promise<unknown> {
    try {
      const URL =
        END_POINT_CLOSE_CONSUMER_CONNECTION + `?consumerId=${consumerId}`;
      return await axios.get(URL);
    } catch (err) {
      return err;
    }
  }

  async getAllDepths(isForSubs: boolean): Promise<QueueDepth[] | number> {
    try {
      const _endPoint =
        END_POINT_GET_DEPTHS + (isForSubs ? '?isForSubs=' + isForSubs : '');
      const _result = await axios.get<QueueDepth[]>(_endPoint);
      return _result.data;
    } catch (e: unknown) {
      console.log(e);
      const err = e as { response?: { status: number } };
      if (err.response?.status === 525) {
        return 525;
      }
      return 505;
    }
  }

  put(
    message: string | number,
    quantity: number,
    queueName: string,
    currency: string | null = null
  ): Promise<unknown> {
    return axios({
      method: 'post',
      url: END_POINT_PUT,
      data: {
        message,
        quantity,
        queueName,
        currency,
      },
    });
  }

  async getFromLimit(
    limit: number,
    queueName: string
  ): Promise<MQMessage | undefined> {
    try {
      const URL = END_POINT_GET + limit + '&queueName=' + queueName;
      const _result = await axios.get<Array<{ msgObject: string }>>(URL);
      return JSON.parse(_result.data[0].msgObject) as MQMessage;
    } catch {
      // no message available
      return undefined;
    }
  }

  async getFromLimitCodingChallange(
    limit: number,
    queueName: string,
    currency_: string,
    consumerId: string
  ): Promise<CodingChallengeResult | undefined> {
    try {
      const URL =
        END_POINT_GET_CODING_CHALLENGE +
        limit +
        '&queueName=' +
        queueName +
        '&currency=' +
        currency_ +
        '&consumerId=' +
        consumerId;
      const _result =
        await axios.get<
          Array<{ msgObject: string; properties: { currency: string } }>
        >(URL);
      const message = JSON.parse(_result.data[0].msgObject) as MQMessage;
      const currency = _result.data[0].properties.currency;
      return {
        message: {
          Message: message.Message,
          Sent: message.Sent,
          count: message.Count,
        },
        currency,
      };
    } catch {
      return undefined;
    }
  }

  async getForSubFromAppId(
    appId: string,
    topic: string | null = null
  ): Promise<SubMessage | -1 | undefined> {
    try {
      const _result = await axios({
        method: 'post',
        url: END_POINT_GETLASTMESSAGEFORSUB,
        data: { appId, topic },
      });

      if (parseInt(String(_result.status)) === 250) {
        return -1;
      }

      const data = _result.data as {
        _lastMessage?: Array<{ msgObject: string }>;
      };

      if (data?._lastMessage?.length) {
        const body = JSON.parse(data._lastMessage[0].msgObject) as {
          Message: string;
          id: string;
          Count: number;
          Sent: string;
        };
        const messageValues = body.Message.split('|@|');
        const title = messageValues[0];
        const message = messageValues[1];
        return {
          Title: title,
          Message: message,
          Count: body.Count,
          Date: body.Sent.substring(0, 25),
          id: body.id,
        };
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  subscribe(appId: string, topic: string): Promise<unknown> | undefined {
    try {
      return axios({
        method: 'post',
        url: END_POINT_SUB,
        data: { appId, topic },
      });
    } catch (e) {
      console.log('Error on updating subscrisber ');
    }
  }

  unsubscribe(appId: string): Promise<unknown> | undefined {
    try {
      return axios.get(END_POINT_UNSUB + '?appId=' + appId);
    } catch (e) {
      console.log('Error on updating subscribers ');
    }
  }

  async publish(
    message: string,
    quantity: number,
    topic: string,
    appId: string
  ): Promise<unknown> {
    return axios({
      method: 'post',
      url: END_POINT_PUB,
      data: { message, quantity, topic, appId },
    });
  }

  async dynPut(
    msg: string,
    quantity: number,
    queueName: string,
    type: string,
    appId: string,
    sessionID: string | null = null
  ): Promise<DynPutResult | -1 | undefined> {
    try {
      const _result = await axios({
        method: 'post',
        url: END_POINT_DYNPUT,
        data: { message: msg, quantity, queueName, type, appId, sessionID },
      });

      if (parseInt(String(_result.status)) === 200) {
        return _result.data as DynPutResult;
      }
      return -1;
    } catch {
      return undefined;
    }
  }

  async getDyn(
    limit: number,
    queueName: string,
    appId: string,
    type: string
  ): Promise<DynGetResult | string | undefined> {
    try {
      const URL =
        END_POINT_GETDYN +
        `limit=${limit}&queueName=${queueName}&appId=${appId}&type=${type}`;
      const _result = await axios.get<
        Array<{ msgObject: string; replyToMsg: string }> & {
          msgObject: string;
        }
      >(URL);
      if (type !== 'DYNPUT') {
        const msg = JSON.parse(
          (_result.data as Array<{ msgObject: string }>)[0].msgObject
        ) as MQMessage;
        const replyQueue = (_result.data as Array<{ replyToMsg: string }>)[0]
          .replyToMsg;
        return { message: msg, replyQueue };
      } else {
        return (
          JSON.parse(
            (_result.data as { msgObject: string }).msgObject
          ) as MQMessage
        ).Message;
      }
    } catch {
      return undefined;
    }
  }
}

export default APIAdapter;
