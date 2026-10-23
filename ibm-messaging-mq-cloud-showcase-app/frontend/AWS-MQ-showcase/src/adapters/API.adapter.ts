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
import type { AxiosResponse } from 'axios';
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

/** Response body of the getLastMessage endpoint. */
interface LastMessageResponse {
  _lastMessage?: Array<{ msgObject: string }>;
}

/** Decoded `msgObject` of a subscription message. */
interface SubMessageBody {
  Message: string;
  id: string;
  Count: number;
  Sent: string;
}

/** Parses the JSON string the backend returns in `msgObject`. */
function parseMsgObject<T>(raw: string): T {
  return JSON.parse(raw) as T; // cast: JSON.parse returns any; shape is the backend contract
}

class APIAdapter {
  async closeProducer(): Promise<void> {
    try {
      await axios.get(END_POINT_CLOSE_PRODUCER_CONNECTION);
    } catch {
      console.log('Error on closing producer connection');
    }
  }

  async closeConsumer(consumerId: string): Promise<void> {
    try {
      const URL =
        END_POINT_CLOSE_CONSUMER_CONNECTION + `?consumerId=${consumerId}`;
      await axios.get(URL);
    } catch {
      console.log('Error on closing consumer connection');
    }
  }

  async getAllDepths(isForSubs: boolean): Promise<QueueDepth[] | 505 | 525> {
    try {
      const _endPoint =
        END_POINT_GET_DEPTHS + (isForSubs ? '?isForSubs=' + isForSubs : '');
      const _result = await axios.get<QueueDepth[]>(_endPoint);
      return _result.data;
    } catch (e) {
      console.log(e);
      if (axios.isAxiosError(e) && e.response?.status === 525) {
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
  ): Promise<AxiosResponse> {
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
      return parseMsgObject<MQMessage>(_result.data[0].msgObject);
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
      const message = parseMsgObject<MQMessage>(_result.data[0].msgObject);
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
      const _result = await axios<LastMessageResponse>({
        method: 'post',
        url: END_POINT_GETLASTMESSAGEFORSUB,
        data: { appId, topic },
      });

      if (parseInt(String(_result.status)) === 250) {
        return -1;
      }

      const data = _result.data;

      if (data?._lastMessage?.length) {
        const body = parseMsgObject<SubMessageBody>(
          data._lastMessage[0].msgObject
        );
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

  subscribe(appId: string, topic: string): Promise<AxiosResponse> {
    return axios({
      method: 'post',
      url: END_POINT_SUB,
      data: { appId, topic },
    });
  }

  unsubscribe(appId: string): Promise<AxiosResponse> {
    return axios.get(END_POINT_UNSUB + '?appId=' + appId);
  }

  async publish(
    message: string,
    quantity: number,
    topic: string,
    appId: string
  ): Promise<AxiosResponse> {
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
      const _result = await axios<DynPutResult>({
        method: 'post',
        url: END_POINT_DYNPUT,
        data: { message: msg, quantity, queueName, type, appId, sessionID },
      });

      if (parseInt(String(_result.status)) === 200) {
        return _result.data;
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
      if (type === 'DYNPUT') {
        const _result = await axios.get<{ msgObject: string }>(URL);
        return parseMsgObject<MQMessage>(_result.data.msgObject).Message;
      }
      const _result =
        await axios.get<Array<{ msgObject: string; replyToMsg: string }>>(URL);
      const msg = parseMsgObject<MQMessage>(_result.data[0].msgObject);
      return { message: msg, replyQueue: _result.data[0].replyToMsg };
    } catch {
      return undefined;
    }
  }
}

export default APIAdapter;
