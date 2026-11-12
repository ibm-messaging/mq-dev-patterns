/**
 * Copyright 2026 IBM Corp.
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
import APIAdapter from './API.adapter';

vi.mock('axios', () => {
  const axiosMock = Object.assign(vi.fn(), {
    get: vi.fn(),
    isAxiosError: vi.fn(
      (e: unknown) => !!(e as { isAxiosError?: boolean })?.isAxiosError
    ),
  });
  return { default: axiosMock };
});

const mockedAxios = vi.mocked(axios);
const mockedGet = vi.mocked(axios.get);
// `axios(config)` is the callable form; cast because vi.mocked keeps axios' overloads.
const mockedCall = mockedAxios as unknown as ReturnType<typeof vi.fn>;

const axiosError = (status: number) => ({
  isAxiosError: true,
  response: { status },
});

const msgObject = (body: object) => JSON.stringify(body);

describe('APIAdapter', () => {
  let adapter: APIAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    adapter = new APIAdapter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('closeProducer', () => {
    it('calls the closeProducer endpoint', async () => {
      mockedGet.mockResolvedValue({});

      await adapter.closeProducer();

      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringContaining('/api/closeProducer')
      );
    });

    it('swallows request errors', async () => {
      mockedGet.mockRejectedValue(new Error('network'));

      await expect(adapter.closeProducer()).resolves.toBeUndefined();
    });
  });

  describe('closeConsumer', () => {
    it('passes the consumer id as a query parameter', async () => {
      mockedGet.mockResolvedValue({});

      await adapter.closeConsumer('consumer-7');

      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/closeConsumer\?consumerId=consumer-7$/)
      );
    });

    it('swallows request errors', async () => {
      mockedGet.mockRejectedValue(new Error('network'));

      await expect(adapter.closeConsumer('x')).resolves.toBeUndefined();
    });
  });

  describe('getAllDepths', () => {
    const depths = [{ name: 'DEV.QUEUE.1', depth: 3 }];

    it('returns the queue depths', async () => {
      mockedGet.mockResolvedValue({ data: depths });

      await expect(adapter.getAllDepths(false)).resolves.toEqual(depths);
      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/qdepth$/)
      );
    });

    it('adds the isForSubs flag for subscription queues', async () => {
      mockedGet.mockResolvedValue({ data: depths });

      await adapter.getAllDepths(true);

      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/qdepth\?isForSubs=true$/)
      );
    });

    it('returns 525 when the queue manager is unreachable', async () => {
      mockedGet.mockRejectedValue(axiosError(525));

      await expect(adapter.getAllDepths(false)).resolves.toBe(525);
    });

    it('returns 505 for any other failure', async () => {
      mockedGet.mockRejectedValueOnce(axiosError(500));
      mockedGet.mockRejectedValueOnce(new Error('boom'));

      await expect(adapter.getAllDepths(false)).resolves.toBe(505);
      await expect(adapter.getAllDepths(false)).resolves.toBe(505);
    });
  });

  describe('put', () => {
    it('posts the message, quantity, queue and currency', async () => {
      mockedCall.mockResolvedValue({ status: 200 });

      await adapter.put('hello', 5, 'DEV.QUEUE.1');

      expect(mockedCall).toHaveBeenCalledWith({
        method: 'post',
        url: expect.stringContaining('/api/mqput'),
        data: {
          message: 'hello',
          quantity: 5,
          queueName: 'DEV.QUEUE.1',
          currency: null,
        },
      });
    });

    it('includes the currency when provided', async () => {
      mockedCall.mockResolvedValue({ status: 200 });

      await adapter.put(100, 1, 'DEV.QUEUE.1', 'USD');

      expect(mockedCall).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ message: 100, currency: 'USD' }),
        })
      );
    });
  });

  describe('getFromLimit', () => {
    it('parses the first message from the response', async () => {
      const message = { Message: 'ticket', Count: 2, Sent: '2026-01-01' };
      mockedGet.mockResolvedValue({
        data: [{ msgObject: msgObject(message) }],
      });

      await expect(adapter.getFromLimit(1, 'DEV.QUEUE.1')).resolves.toEqual(
        message
      );
      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/mqget\?limit=1&queueName=DEV\.QUEUE\.1$/)
      );
    });

    it('returns undefined when no message is available', async () => {
      mockedGet.mockResolvedValue({ data: [] });
      await expect(adapter.getFromLimit(1, 'q')).resolves.toBeUndefined();

      mockedGet.mockRejectedValue(new Error('empty'));
      await expect(adapter.getFromLimit(1, 'q')).resolves.toBeUndefined();
    });
  });

  describe('getFromLimitCodingChallange', () => {
    it('maps the message and currency from the response', async () => {
      mockedGet.mockResolvedValue({
        data: [
          {
            msgObject: msgObject({
              Message: '50',
              Sent: '2026-02-02',
              Count: 4,
            }),
            properties: { currency: 'GBP' },
          },
        ],
      });

      const result = await adapter.getFromLimitCodingChallange(
        1,
        'DEV.QUEUE.1',
        'GBP',
        'c1'
      );

      expect(result).toEqual({
        message: { Message: '50', Sent: '2026-02-02', count: 4 },
        currency: 'GBP',
      });
      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringMatching(
          /\/api\/getCodingChallange\?limit=1&queueName=DEV\.QUEUE\.1&currency=GBP&consumerId=c1$/
        )
      );
    });

    it('returns undefined on failure', async () => {
      mockedGet.mockRejectedValue(new Error('boom'));

      await expect(
        adapter.getFromLimitCodingChallange(1, 'q', 'EUR', 'c')
      ).resolves.toBeUndefined();
    });
  });

  describe('getForSubFromAppId', () => {
    it('splits title and message and trims the date', async () => {
      mockedCall.mockResolvedValue({
        status: 200,
        data: {
          _lastMessage: [
            {
              msgObject: msgObject({
                Message: 'Breaking|@|Something happened',
                id: 'm1',
                Count: 3,
                Sent: '2026-03-03T10:20:30.123456789Z',
              }),
            },
          ],
        },
      });

      const result = await adapter.getForSubFromAppId('app1', 'dev/topic');

      expect(result).toEqual({
        Title: 'Breaking',
        Message: 'Something happened',
        Count: 3,
        Date: '2026-03-03T10:20:30.123456789Z'.substring(0, 25),
        id: 'm1',
      });
      expect(mockedCall).toHaveBeenCalledWith({
        method: 'post',
        url: expect.stringContaining('/api/getLastMessage'),
        data: { appId: 'app1', topic: 'dev/topic' },
      });
    });

    it('returns -1 when the backend answers 250', async () => {
      mockedCall.mockResolvedValue({ status: 250, data: {} });

      await expect(adapter.getForSubFromAppId('app1')).resolves.toBe(-1);
    });

    it('returns undefined when there is no message or the call fails', async () => {
      mockedCall.mockResolvedValueOnce({
        status: 200,
        data: { _lastMessage: [] },
      });
      await expect(adapter.getForSubFromAppId('app1')).resolves.toBeUndefined();

      mockedCall.mockRejectedValueOnce(new Error('boom'));
      await expect(adapter.getForSubFromAppId('app1')).resolves.toBeUndefined();
    });
  });

  describe('subscribe / unsubscribe / publish', () => {
    it('subscribe posts appId and topic', async () => {
      mockedCall.mockResolvedValue({ status: 200 });

      await adapter.subscribe('app1', 'dev/topic');

      expect(mockedCall).toHaveBeenCalledWith({
        method: 'post',
        url: expect.stringContaining('/api/sub'),
        data: { appId: 'app1', topic: 'dev/topic' },
      });
    });

    it('unsubscribe sends the appId as a query parameter', async () => {
      mockedGet.mockResolvedValue({ status: 200 });

      await adapter.unsubscribe('app1');

      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/unsub\?appId=app1$/)
      );
    });

    it('publish posts message, quantity, topic and appId', async () => {
      mockedCall.mockResolvedValue({ status: 200 });

      await adapter.publish('news', 2, 'dev/topic', 'app1');

      expect(mockedCall).toHaveBeenCalledWith({
        method: 'post',
        url: expect.stringContaining('/api/pub'),
        data: {
          message: 'news',
          quantity: 2,
          topic: 'dev/topic',
          appId: 'app1',
        },
      });
    });
  });

  describe('dynPut', () => {
    it('returns the response data on HTTP 200', async () => {
      mockedCall.mockResolvedValue({
        status: 200,
        data: { _name: 'APP.REPLIES.1' },
      });

      await expect(
        adapter.dynPut('hi', 1, 'DEV.QUEUE.1', 'DYNPUT', 'app1')
      ).resolves.toEqual({ _name: 'APP.REPLIES.1' });
      expect(mockedCall).toHaveBeenCalledWith({
        method: 'post',
        url: expect.stringContaining('/api/putReq'),
        data: {
          message: 'hi',
          quantity: 1,
          queueName: 'DEV.QUEUE.1',
          type: 'DYNPUT',
          appId: 'app1',
          sessionID: null,
        },
      });
    });

    it('returns -1 for a non-200 success status', async () => {
      mockedCall.mockResolvedValue({ status: 204, data: {} });

      await expect(
        adapter.dynPut('hi', 1, 'q', 'DYNPUT', 'app1')
      ).resolves.toBe(-1);
    });

    it('returns undefined on failure', async () => {
      mockedCall.mockRejectedValue(new Error('boom'));

      await expect(
        adapter.dynPut('hi', 1, 'q', 'DYNPUT', 'app1')
      ).resolves.toBeUndefined();
    });
  });

  describe('getDyn', () => {
    it('returns only the message text for DYNPUT', async () => {
      mockedGet.mockResolvedValue({
        data: { msgObject: msgObject({ Message: 'reply text' }) },
      });

      await expect(
        adapter.getDyn(1, 'APP.REPLIES.1', 'app1', 'DYNPUT')
      ).resolves.toBe('reply text');
      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringMatching(
          /\/api\/getRes\?limit=1&queueName=APP\.REPLIES\.1&appId=app1&type=DYNPUT$/
        )
      );
    });

    it('returns the message with its reply queue for other types', async () => {
      mockedGet.mockResolvedValue({
        data: [
          {
            msgObject: msgObject({ Message: 'request' }),
            replyToMsg: 'APP.REPLIES.2',
          },
        ],
      });

      await expect(
        adapter.getDyn(1, 'DEV.QUEUE.1', 'app1', 'DYNGET')
      ).resolves.toEqual({
        message: { Message: 'request' },
        replyQueue: 'APP.REPLIES.2',
      });
    });

    it('returns undefined on failure', async () => {
      mockedGet.mockRejectedValue(new Error('boom'));

      await expect(
        adapter.getDyn(1, 'q', 'app1', 'DYNGET')
      ).resolves.toBeUndefined();
    });
  });
});
