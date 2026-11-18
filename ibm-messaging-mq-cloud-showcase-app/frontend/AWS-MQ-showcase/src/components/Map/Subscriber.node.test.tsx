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

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import SubscriberNode from './Subscriber.node';
import useStore from '../MQPatterns/PubSub/store';
import type { ConsumerFlowNode } from '../../types';

// Mock API functions (created early so vi.mock below can use them).
const adapter = vi.hoisted(() => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  getForSubFromAppId: vi.fn(),
}));
// Mock toast functions (created early so the toast mock below can use them).
const toast = vi.hoisted(() => ({
  promise: vi.fn(),
  success: vi.fn(),
}));

// Replace the real API adapter so no network calls are made.
vi.mock('../../adapters/API.adapter', () => ({
  default: class {
    subscribe = adapter.subscribe;
    unsubscribe = adapter.unsubscribe;
    getForSubFromAppId = adapter.getForSubFromAppId;
  },
}));

// Fake toasts that record what is shown and ignore rejected promises.
vi.mock('react-toastify', () => ({
  toast: {
    promise: (promise: Promise<unknown>, messages: unknown) => {
      toast.promise(messages);
      promise.catch(() => {});
    },
    success: (message: string) => toast.success(message),
  },
}));

const TOPIC = 'tickets/classic';
// Ids from the default graph: topic '2' is connected to subscriber '3'
// through the edge '2-3'.
const SUBSCRIBER_ID = '3';
const EDGE_ID = '2-3';
// Poll delay: Math.random is mocked to 0.5, which gives 2.5 seconds.
const POLL_MS = 2500;

const MESSAGE = {
  Title: 'Sale',
  Message: 'Everything is half price',
  Count: 1,
  Date: '2026-11-10 10:00',
  id: 'm1',
};

type Data = ConsumerFlowNode['data'];

const makeProps = (data: Partial<Data> = {}): NodeProps<ConsumerFlowNode> => ({
  id: SUBSCRIBER_ID,
  type: 'consumer',
  data: {
    role: 'Consumer',
    label: 'Classic consumer 1',
    connectedQueue: TOPIC,
    isActive: false,
    subscriptionState: 0,
    ...data,
  },
  selected: false,
  dragging: false,
  draggable: true,
  selectable: true,
  deletable: true,
  zIndex: 0,
  isConnectable: true,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
});

// Renders the Subscriber; `update` re-renders it with new data.
function renderSubscriber(data: Partial<Data> = {}) {
  const ui = (d: Partial<Data>) => (
    <ReactFlowProvider>
      <SubscriberNode {...makeProps(d)} />
    </ReactFlowProvider>
  );
  const result = render(ui(data));
  return {
    ...result,
    update: (d: Partial<Data>) => result.rerender(ui(d)),
  };
}

const flushPromises = () => act(async () => {});

/** Advances fake timers and lets the awaited poll callback finish. */
const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const isEdgeAnimated = () =>
  useStore.getState().edges.find((e) => e.id === EDGE_ID)?.animated;

const valueOf = (label: string) => screen.getByText(label).nextSibling;

// Subscriber node: subscribe, poll for notifications, show them, delete.
describe('SubscriberNode', () => {
  beforeEach(() => {
    useStore.setState(useStore.getInitialState(), true);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    adapter.subscribe.mockResolvedValue({});
    adapter.unsubscribe.mockResolvedValue({});
    adapter.getForSubFromAppId.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('shows an empty subscriber before any notification', async () => {
      renderSubscriber();
      await flushPromises();

      expect(screen.getByText('Subscriber')).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toHaveValue('Classic consumer 1');
      expect(
        screen.getByText('Last notification received')
      ).toBeInTheDocument();
      expect(valueOf('Title')).toHaveTextContent('—');
      expect(valueOf('Message')).toHaveTextContent('—');
      expect(valueOf('Date')).toHaveTextContent('—');
      expect(screen.getByText(/Notifications received:/)).toHaveTextContent(
        'Notifications received: 0'
      );
    });

    it('falls back to "Subscriber" when the node has no label', async () => {
      renderSubscriber({ label: '' });
      await flushPromises();

      expect(screen.getByLabelText('Name')).toHaveValue('Subscriber');
    });

    it('shows the topic once the subscription succeeded', async () => {
      renderSubscriber();
      await flushPromises();

      expect(screen.getByText(`Subscribed to: ${TOPIC}`)).toBeInTheDocument();
    });

    it('shows no subscription without a connected topic', async () => {
      renderSubscriber({ connectedQueue: '' });
      await flushPromises();

      expect(screen.queryByText(/Subscribed to/)).not.toBeInTheDocument();
    });

    // Light green before subscribing, darker green after.
    it('turns the header darker once subscribed', async () => {
      renderSubscriber();
      const header = screen
        .getByText('Subscriber', { selector: '.node-card__header-title' })
        .closest('.node-card__header');
      expect(header).toHaveStyle({ backgroundColor: '#defbe6' });

      await flushPromises();

      expect(header).toHaveStyle({ backgroundColor: '#a7f0ba' });
    });
  });

  describe('subscribing', () => {
    it('subscribes to the connected topic on mount', async () => {
      renderSubscriber();
      await flushPromises();

      expect(adapter.subscribe).toHaveBeenCalledTimes(1);
      expect(adapter.subscribe).toHaveBeenCalledWith(SUBSCRIBER_ID, TOPIC);
      expect(toast.promise).toHaveBeenCalledWith({
        pending: 'Waiting for subscription',
        success: 'Success on subscribing',
        error: 'Error on subscribing',
      });
    });

    it('does not subscribe without a connected topic', async () => {
      renderSubscriber({ connectedQueue: '' });
      await flushPromises();

      expect(adapter.subscribe).not.toHaveBeenCalled();
    });

    it('does not subscribe when the subscription state is 2', async () => {
      renderSubscriber({ subscriptionState: 2 });
      await flushPromises();

      expect(adapter.subscribe).not.toHaveBeenCalled();
      expect(screen.queryByText(/Subscribed to/)).not.toBeInTheDocument();
    });

    it('subscribes when it gets connected to a topic later on', async () => {
      const { update } = renderSubscriber({ connectedQueue: '' });
      await flushPromises();

      update({ connectedQueue: 'tickets/VIP' });
      await flushPromises();

      expect(adapter.subscribe).toHaveBeenCalledWith(
        SUBSCRIBER_ID,
        'tickets/VIP'
      );
      expect(
        screen.getByText('Subscribed to: tickets/VIP')
      ).toBeInTheDocument();
    });

    it('removes its connection when the subscription fails', async () => {
      adapter.subscribe.mockRejectedValue(new Error('no broker'));
      renderSubscriber();
      await flushPromises();

      expect(screen.queryByText(/Subscribed to/)).not.toBeInTheDocument();
      expect(
        useStore.getState().edges.find((e) => e.id === EDGE_ID)
      ).toBeUndefined();
    });
  });

  describe('unsubscribing', () => {
    it('unsubscribes when the subscription state changes to 2', async () => {
      const { update } = renderSubscriber();
      await flushPromises();

      update({ subscriptionState: 2 });
      await flushPromises();

      expect(adapter.unsubscribe).toHaveBeenCalledTimes(1);
      expect(adapter.unsubscribe).toHaveBeenCalledWith(SUBSCRIBER_ID);
      expect(toast.promise).toHaveBeenCalledWith({
        pending: 'Waiting for unsubscribing',
        success: 'Success on unsubscribing',
        error: 'Error on unsubscribing',
      });
      expect(screen.queryByText(/Subscribed to/)).not.toBeInTheDocument();
    });

    it('unsubscribes when the topic is disconnected', async () => {
      const { update } = renderSubscriber();
      await flushPromises();

      update({ connectedQueue: '' });
      await flushPromises();

      expect(adapter.unsubscribe).toHaveBeenCalledWith(SUBSCRIBER_ID);
      expect(screen.queryByText(/Subscribed to/)).not.toBeInTheDocument();
    });

    it('does not unsubscribe when it never subscribed', async () => {
      const { update } = renderSubscriber({ subscriptionState: 2 });
      await flushPromises();

      update({ subscriptionState: 2, connectedQueue: '' });
      await flushPromises();

      expect(adapter.unsubscribe).not.toHaveBeenCalled();
    });

    it('is no longer subscribed even if the unsubscribe call fails', async () => {
      adapter.unsubscribe.mockRejectedValue(new Error('no broker'));
      const { update } = renderSubscriber();
      await flushPromises();

      update({ subscriptionState: 2 });
      await flushPromises();

      expect(screen.queryByText(/Subscribed to/)).not.toBeInTheDocument();
    });
  });

  describe('polling', () => {
    // Fake timers: advance 10s and check that no poll was sent.
    it('does not poll without a subscription', async () => {
      vi.useFakeTimers();
      renderSubscriber({ connectedQueue: '' });

      await advance(10000);

      expect(adapter.getForSubFromAppId).not.toHaveBeenCalled();
    });

    // Math.random is mocked to 0.5, so the poll delay is exactly POLL_MS.
    it('polls the topic at a random 1.5 - 3.5 s interval once subscribed', async () => {
      vi.useFakeTimers();
      renderSubscriber();
      await advance(0);

      await advance(POLL_MS - 1);
      expect(adapter.getForSubFromAppId).not.toHaveBeenCalled();

      await advance(1);
      expect(adapter.getForSubFromAppId).toHaveBeenCalledTimes(1);
      expect(adapter.getForSubFromAppId).toHaveBeenCalledWith(
        SUBSCRIBER_ID,
        TOPIC
      );
    });

    it('ignores an undefined answer', async () => {
      vi.useFakeTimers();
      renderSubscriber();
      await advance(0);

      await advance(POLL_MS);

      expect(valueOf('Title')).toHaveTextContent('—');
      expect(screen.getByText(/Notifications received:/)).toHaveTextContent(
        'Notifications received: 0'
      );
      expect(toast.success).not.toHaveBeenCalled();
    });

    // An answer of -1 confirms the subscription; the count stays 0.
    it('confirms the subscription when the answer is -1', async () => {
      vi.useFakeTimers();
      adapter.getForSubFromAppId.mockResolvedValue(-1);
      renderSubscriber();
      await advance(0);

      await advance(POLL_MS);

      expect(toast.success).toHaveBeenCalledWith('Success on subscription');
      expect(screen.getByText(/Notifications received:/)).toHaveTextContent(
        'Notifications received: 0'
      );
    });

    // console.log is mocked to check that the error is logged.
    it('logs a failing poll instead of throwing', async () => {
      vi.useFakeTimers();
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      adapter.getForSubFromAppId.mockRejectedValueOnce(new Error('boom'));
      renderSubscriber();
      await advance(0);

      await advance(POLL_MS);

      expect(log).toHaveBeenCalled();
    });

    // Fake timers: the first poll rejects, the second must still run.
    it('keeps polling after a failed poll', async () => {
      vi.useFakeTimers();
      vi.spyOn(console, 'log').mockImplementation(() => {});
      adapter.getForSubFromAppId.mockRejectedValueOnce(new Error('boom'));
      renderSubscriber();
      await advance(0);

      await advance(POLL_MS);
      await advance(POLL_MS);

      expect(adapter.getForSubFromAppId).toHaveBeenCalledTimes(2);
    });
  });

  describe('receiving a notification', () => {
    // Delivers one notification, then returns the rendered view.
    async function receiveOne() {
      vi.useFakeTimers();
      adapter.getForSubFromAppId.mockResolvedValueOnce(MESSAGE);
      const view = renderSubscriber();
      await advance(0);
      await advance(POLL_MS);
      return view;
    }

    it('shows the last notification and counts it', async () => {
      await receiveOne();

      expect(valueOf('Title')).toHaveTextContent('Sale');
      expect(valueOf('Message')).toHaveTextContent('Everything is half price');
      expect(valueOf('Date')).toHaveTextContent('2026-11-10 10:00');
      expect(screen.getByText(/Notifications received:/)).toHaveTextContent(
        'Notifications received: 1'
      );
    });

    // Fake timers: two poll intervals, each one returns a message.
    it('counts every notification it receives', async () => {
      vi.useFakeTimers();
      adapter.getForSubFromAppId.mockResolvedValue(MESSAGE);
      renderSubscriber();
      await advance(0);

      await advance(POLL_MS);
      await advance(POLL_MS);

      expect(screen.getByText(/Notifications received:/)).toHaveTextContent(
        'Notifications received: 2'
      );
    });

    it('sends a message particle along the incoming edge', async () => {
      const edgeIds: string[] = [];
      const listener = (e: Event) =>
        edgeIds.push((e as CustomEvent).detail.edgeId);
      window.addEventListener('mq-message-flow', listener);

      await receiveOne();

      window.removeEventListener('mq-message-flow', listener);
      expect(edgeIds).toEqual([EDGE_ID]);
    });

    it('animates the incoming edge for one second', async () => {
      await receiveOne();
      expect(isEdgeAnimated()).toBe(true);

      await advance(999);
      expect(isEdgeAnimated()).toBe(true);

      await advance(1);
      expect(isEdgeAnimated()).toBe(false);
    });
  });

  describe('deleting', () => {
    it('unsubscribes and removes the node from the flow', async () => {
      const user = userEvent.setup();
      renderSubscriber();
      await flushPromises();

      await user.click(
        screen.getByRole('button', { name: 'Delete Subscriber' })
      );

      expect(adapter.unsubscribe).toHaveBeenCalledWith(SUBSCRIBER_ID);
      expect(
        useStore.getState().nodes.find((n) => n.id === SUBSCRIBER_ID)
      ).toBeUndefined();
    });
  });
});
