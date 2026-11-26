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

// Tests the Consumer node (Map/Consumer.node.tsx). It checks the toggle and
// the Active/Inactive state. It checks that the queue is polled only while the
// node is on. It checks the message shown, the counters and the delete button.
// It also checks the coding challenge build (limited reads, the challenge
// message and its error handling). The API adapter is mocked.

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import ConsumerNode from './Consumer.node';
import useStore from '../MQPatterns/PointToPoint/store';
import type { ConsumerFlowNode } from '../../types';

const adapter = vi.hoisted(() => ({
  getFromLimit: vi.fn(),
  getFromLimitCodingChallange: vi.fn(),
  closeConsumer: vi.fn(),
}));

vi.mock('../../adapters/API.adapter', () => ({
  default: class {
    getFromLimit = adapter.getFromLimit;
    getFromLimitCodingChallange = adapter.getFromLimitCodingChallange;
    closeConsumer = adapter.closeConsumer;
  },
}));

// Ids and names that match the default graph in the store.
const QUEUE_NAME = 'DEV.QUEUE.1';
const CONSUMER_ID = '2';
const QUEUE_ID = '3';

const MESSAGE = {
  Message: 'You bought a new ticket!',
  Sent: '2026-11-10T10:00:00.000Z',
  Count: 4,
};

// Renders the Consumer node, wired to the store so toggling updates the UI.
function renderConsumer(connectedQueue = QUEUE_NAME) {
  const props: NodeProps<ConsumerFlowNode> = {
    id: CONSUMER_ID,
    type: 'consumer',
    data: {
      role: 'Consumer',
      label: 'Customer 2',
      connectedQueue,
      isActive: false,
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
  };

  const Connected = () => {
    const isActive = useStore(
      (state) => state.nodes.find((n) => n.id === CONSUMER_ID)?.data.isActive
    );
    return (
      <ConsumerNode
        {...props}
        data={{ ...props.data, isActive: Boolean(isActive) }}
      />
    );
  };

  return render(
    <ReactFlowProvider>
      <Connected />
    </ReactFlowProvider>
  );
}

const getToggle = () => screen.getByRole('switch');
const isActive = () =>
  useStore.getState().nodes.find((n) => n.id === CONSUMER_ID)?.data.isActive;

/** Advances fake timers and lets the awaited poll callback finish. */
const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

describe('ConsumerNode', () => {
  beforeEach(() => {
    useStore.setState(useStore.getInitialState(), true);
    adapter.getFromLimit.mockResolvedValue(undefined);
    adapter.closeConsumer.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('shows an inactive consumer with no message yet', () => {
      renderConsumer();

      expect(screen.getByText('Consumer app')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByText('Received').nextSibling).toHaveTextContent('0');
      expect(screen.getByText('Counter:')).toHaveTextContent('Counter: 0');
      expect(
        screen.getByText('Toggle on to start receiving')
      ).toBeInTheDocument();
    });

    it('shows a dash for the type and date before any message arrives', () => {
      renderConsumer();

      expect(screen.getByText('Type').nextSibling).toHaveTextContent('—');
      expect(screen.getByText('Date').nextSibling).toHaveTextContent('—');
    });
  });

  describe('toggle', () => {
    it('is enabled when a queue is connected', () => {
      renderConsumer();

      expect(getToggle()).toBeEnabled();
    });

    it('is disabled without a connected queue', () => {
      renderConsumer('');

      expect(getToggle()).toBeDisabled();
    });

    it('activates the consumer and its edges when switched on', async () => {
      const user = userEvent.setup();
      renderConsumer();

      await user.click(getToggle());

      expect(isActive()).toBe(true);
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(
        screen.queryByText('Toggle on to start receiving')
      ).not.toBeInTheDocument();
      expect(
        useStore.getState().edges.find((e) => e.id === '3-2')?.animated
      ).toBe(true);
    });

    it('deactivates the consumer when switched off again', async () => {
      const user = userEvent.setup();
      renderConsumer();

      await user.click(getToggle());
      await user.click(getToggle());

      expect(isActive()).toBe(false);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  describe('polling', () => {
    it('does not poll while inactive', async () => {
      vi.useFakeTimers();
      renderConsumer();

      await advance(10000);

      expect(adapter.getFromLimit).not.toHaveBeenCalled();
    });

    it('polls the connected queue every 2 seconds once active', async () => {
      vi.useFakeTimers();
      renderConsumer();
      act(() => useStore.getState().onClick(CONSUMER_ID));

      await advance(1999);
      expect(adapter.getFromLimit).not.toHaveBeenCalled();

      await advance(1);
      expect(adapter.getFromLimit).toHaveBeenCalledTimes(1);
      expect(adapter.getFromLimit).toHaveBeenCalledWith(1, QUEUE_NAME);

      await advance(2000);
      expect(adapter.getFromLimit).toHaveBeenCalledTimes(2);
    });

    it('stops polling when switched off', async () => {
      vi.useFakeTimers();
      renderConsumer();
      act(() => useStore.getState().onClick(CONSUMER_ID));
      await advance(2000);
      adapter.getFromLimit.mockClear();

      act(() => useStore.getState().onClick(CONSUMER_ID));
      await advance(10000);

      expect(adapter.getFromLimit).not.toHaveBeenCalled();
    });

    it('does not poll without a connected queue', async () => {
      vi.useFakeTimers();
      renderConsumer('');
      act(() => useStore.getState().onClick(CONSUMER_ID));

      await advance(10000);

      expect(adapter.getFromLimit).not.toHaveBeenCalled();
    });

    it('shows the received message and counts it', async () => {
      vi.useFakeTimers();
      adapter.getFromLimit.mockResolvedValue(MESSAGE);
      renderConsumer();
      act(() => useStore.getState().onClick(CONSUMER_ID));

      await advance(2000);

      expect(screen.getByText('Received').nextSibling).toHaveTextContent('1');
      expect(screen.getByText('Type').nextSibling).toHaveTextContent(
        MESSAGE.Message
      );
      expect(screen.getByText('Date').nextSibling).toHaveTextContent(
        '2026-11-10'
      );
      expect(screen.getByText('Counter:')).toHaveTextContent('Counter: 4');
    });

    // 6000 ms is 3 polls, and each poll returns a message.
    it('adds one to the received count per message', async () => {
      vi.useFakeTimers();
      adapter.getFromLimit.mockResolvedValue(MESSAGE);
      renderConsumer();
      act(() => useStore.getState().onClick(CONSUMER_ID));

      await advance(6000);

      expect(screen.getByText('Received').nextSibling).toHaveTextContent('3');
    });

    it('lowers the local queue depth for each message consumed', async () => {
      vi.useFakeTimers();
      adapter.getFromLimit.mockResolvedValue(MESSAGE);
      renderConsumer();
      act(() => {
        useStore.getState().setNodeDepth(QUEUE_ID, 3);
        useStore.getState().onClick(CONSUMER_ID);
      });

      await advance(2000);
      expect(useStore.getState().localDepths[QUEUE_ID]).toBe(2);

      await advance(2000);
      expect(useStore.getState().localDepths[QUEUE_ID]).toBe(1);
    });

    it('leaves the counters alone when the queue is empty', async () => {
      vi.useFakeTimers();
      adapter.getFromLimit.mockResolvedValue(undefined);
      renderConsumer();
      act(() => {
        useStore.getState().setNodeDepth(QUEUE_ID, 3);
        useStore.getState().onClick(CONSUMER_ID);
      });

      await advance(4000);

      expect(adapter.getFromLimit).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Received').nextSibling).toHaveTextContent('0');
      expect(useStore.getState().localDepths[QUEUE_ID]).toBe(3);
    });

    // The first request fails and is logged. The next poll still works.
    it('keeps polling after the adapter throws', async () => {
      vi.useFakeTimers();
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      adapter.getFromLimit.mockRejectedValueOnce(new Error('boom'));
      adapter.getFromLimit.mockResolvedValue(MESSAGE);
      renderConsumer();
      act(() => useStore.getState().onClick(CONSUMER_ID));

      await advance(4000);

      expect(log).toHaveBeenCalled();
      expect(screen.getByText('Received').nextSibling).toHaveTextContent('1');
    });
  });

  describe('delete', () => {
    it('removes the node and closes the consumer connection', async () => {
      const user = userEvent.setup();
      renderConsumer();

      await user.click(
        screen.getByRole('button', { name: 'Delete Consumer app' })
      );

      expect(
        useStore.getState().nodes.find((n) => n.id === CONSUMER_ID)
      ).toBeUndefined();
      expect(adapter.closeConsumer).toHaveBeenCalledWith(CONSUMER_ID);
    });
  });

  // The coding challenge build shows a cash receiver with a currency filter.
  // The flag is read when the node renders, so each test sets it first.
  describe('coding challenge', () => {
    const CHALLENGE_MESSAGE = {
      message: {
        Message: '25',
        Sent: '2026-11-10T10:00:00.000Z',
        count: 4,
      },
      currency: 'EUR',
    };

    // The value next to a label in the stats list. The currency dropdown also
    // has the label "Currency", so look at the stat labels only.
    const statValue = (label: string) =>
      Array.from(document.querySelectorAll('.node-card__stat-label')).find(
        (el) => el.textContent?.trim() === label
      )?.nextSibling;

    beforeEach(() => {
      process.env.REACT_APP_IS_FOR_CODING_CHALLENGE = 'true';
      adapter.getFromLimitCodingChallange.mockResolvedValue(undefined);
    });

    afterEach(() => {
      process.env.REACT_APP_IS_FOR_CODING_CHALLENGE = 'false';
    });

    it('shows the currency filter and empty stats before any message', () => {
      renderConsumer();

      expect(screen.getByText('Filtering by EUR')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(statValue('Received')).toHaveTextContent('0');
      expect(statValue('Amount')).toHaveTextContent('—');
      expect(statValue('Currency')).toHaveTextContent('—');
      expect(statValue('Date')).toHaveTextContent('—');
      expect(screen.getByText('Count').nextSibling).toHaveTextContent('—');
      expect(screen.queryByText('Type')).not.toBeInTheDocument();
    });

    it('filters by the currency the user picked', async () => {
      const user = userEvent.setup();
      renderConsumer();

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'USD' }));

      expect(screen.getByText('Filtering by USD')).toBeInTheDocument();
    });

    it('activates when switched on and shows the active status', async () => {
      const user = userEvent.setup();
      renderConsumer();

      await user.click(getToggle());

      expect(isActive()).toBe(true);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('polls with the currency filter and the node id every 2 seconds', async () => {
      vi.useFakeTimers();
      renderConsumer();
      act(() => useStore.getState().onClick(CONSUMER_ID));

      await advance(2000);

      expect(adapter.getFromLimitCodingChallange).toHaveBeenCalledWith(
        1,
        QUEUE_NAME,
        'EUR',
        CONSUMER_ID
      );
      expect(adapter.getFromLimit).not.toHaveBeenCalled();
    });

    it('shows the amount, currency, date and count of the received message', async () => {
      vi.useFakeTimers();
      adapter.getFromLimitCodingChallange.mockResolvedValue(CHALLENGE_MESSAGE);
      renderConsumer();
      act(() => useStore.getState().onClick(CONSUMER_ID));

      await advance(2000);

      expect(statValue('Received')).toHaveTextContent('1');
      expect(statValue('Amount')).toHaveTextContent('25');
      expect(statValue('Currency')).toHaveTextContent('EUR');
      expect(statValue('Date')).toHaveTextContent('2026-11-10');
      expect(screen.getByText('Count').nextSibling).toHaveTextContent('4');
    });

    it('leaves the stats alone when the queue is empty', async () => {
      vi.useFakeTimers();
      renderConsumer();
      act(() => useStore.getState().onClick(CONSUMER_ID));

      await advance(4000);

      expect(adapter.getFromLimitCodingChallange).toHaveBeenCalledTimes(2);
      expect(statValue('Received')).toHaveTextContent('0');
      expect(statValue('Amount')).toHaveTextContent('—');
    });

    it('removes the node on delete', async () => {
      const user = userEvent.setup();
      renderConsumer();

      await user.click(
        screen.getByRole('button', { name: 'Delete Consumer app' })
      );

      expect(
        useStore.getState().nodes.find((n) => n.id === CONSUMER_ID)
      ).toBeUndefined();
    });
  });
});
