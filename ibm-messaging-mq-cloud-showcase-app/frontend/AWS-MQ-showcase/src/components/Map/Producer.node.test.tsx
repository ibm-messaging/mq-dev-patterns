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

// Tests the Producer node (Map/Producer.node.tsx). It checks the send button
// and the quantity field. It checks the message put on the queue, the counters
// and the 1.8 second wait after a send. It checks auto send every 10 seconds.
// It checks that the node can be deleted. It also checks the coding challenge
// version (REACT_APP_IS_FOR_CODING_CHALLENGE on): the "Send cash" form with the
// sender name, the amount and the currency, the message put on the queue, and
// that there is no auto send switch. The API adapter is mocked.

import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import ProducerNode from './Producer.node';
import useStore from '../MQPatterns/PointToPoint/store';
import type { ProducerFlowNode } from '../../types';

const adapter = vi.hoisted(() => ({
  put: vi.fn(),
  closeProducer: vi.fn(),
}));

vi.mock('../../adapters/API.adapter', () => ({
  default: class {
    put = adapter.put;
    closeProducer = adapter.closeProducer;
  },
}));

const QUEUE_NAME = 'DEV.QUEUE.1';
const PRODUCER_ID = '1';
const QUEUE_ID = '3';

function renderProducer(connectedQueue = QUEUE_NAME) {
  const props: NodeProps<ProducerFlowNode> = {
    id: PRODUCER_ID,
    type: 'producer',
    data: {
      role: 'Producer',
      label: 'Tickets Generator',
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
  return render(
    <ReactFlowProvider>
      <ProducerNode {...props} />
    </ReactFlowProvider>
  );
}

const getSendButton = () =>
  screen.getByRole('button', { name: 'Create booking' });

const flushPromises = () => act(async () => {});

describe('ProducerNode', () => {
  beforeEach(() => {
    useStore.setState(useStore.getInitialState(), true);
    adapter.put.mockResolvedValue({});
    adapter.closeProducer.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('shows the title, the application name and the sent counter', () => {
      renderProducer();

      expect(screen.getByText('Producer app')).toBeInTheDocument();
      expect(screen.getByLabelText('Application name')).toHaveValue(
        'Tickets Generator'
      );
      expect(screen.getByText(/Total sent:/)).toHaveTextContent(
        'Total sent: 0'
      );
    });

    it('shows the default quantity of 5', () => {
      renderProducer();

      expect(screen.getByLabelText('Quantity per request')).toHaveValue(5);
    });

    it('lets the user rename the application', async () => {
      const user = userEvent.setup();
      renderProducer();

      const input = screen.getByLabelText('Application name');
      await user.clear(input);
      await user.type(input, 'Box office');

      expect(input).toHaveValue('Box office');
    });

    it('shows auto send as off by default', () => {
      renderProducer();

      expect(screen.getByRole('switch')).not.toBeChecked();
      expect(screen.getByText('Off')).toBeInTheDocument();
    });
  });

  describe('send button', () => {
    it('is enabled when the producer is connected to a queue', () => {
      renderProducer();

      expect(getSendButton()).toBeEnabled();
    });

    it('is disabled without a connected queue', () => {
      renderProducer('');

      expect(getSendButton()).toBeDisabled();
    });

    it('is disabled when the quantity is not positive', async () => {
      const user = userEvent.setup();
      renderProducer();

      const input = screen.getByLabelText('Quantity per request');
      await user.clear(input);
      await user.type(input, '0');

      expect(getSendButton()).toBeDisabled();
    });

    it('puts the message on the connected queue', async () => {
      const user = userEvent.setup();
      renderProducer();

      await user.click(getSendButton());

      expect(adapter.put).toHaveBeenCalledTimes(1);
      expect(adapter.put).toHaveBeenCalledWith(
        'You bought a new ticket!',
        5,
        QUEUE_NAME
      );
    });

    it('sends the quantity the user entered', async () => {
      const user = userEvent.setup();
      renderProducer();
      const input = screen.getByLabelText('Quantity per request');
      await user.clear(input);
      await user.type(input, '3');

      await user.click(getSendButton());

      expect(adapter.put).toHaveBeenCalledWith(
        'You bought a new ticket!',
        3,
        QUEUE_NAME
      );
    });

    it('raises the queue depth and the sent counter once the put succeeds', async () => {
      const user = userEvent.setup();
      renderProducer();

      await user.click(getSendButton());

      expect(screen.getByText(/Total sent:/)).toHaveTextContent(
        'Total sent: 5'
      );
      expect(useStore.getState().localDepths[QUEUE_ID]).toBe(5);
    });

    // Fake timers: the button is off for 1800 ms, so wait that long between sends.
    // Two sends of 5 add up to 10.
    it('accumulates the total over several sends', async () => {
      vi.useFakeTimers();
      renderProducer();

      fireEvent.click(getSendButton());
      await flushPromises();
      act(() => {
        vi.advanceTimersByTime(1800);
      });
      fireEvent.click(getSendButton());
      await flushPromises();

      expect(screen.getByText(/Total sent:/)).toHaveTextContent(
        'Total sent: 10'
      );
    });

    it('animates the outgoing edge and disables itself for 1.8 seconds', async () => {
      vi.useFakeTimers();
      renderProducer();

      fireEvent.click(getSendButton());
      await flushPromises();

      expect(getSendButton()).toBeDisabled();
      expect(
        useStore.getState().edges.find((e) => e.id === '1-3')?.animated
      ).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1800);
      });

      expect(getSendButton()).toBeEnabled();
      expect(
        useStore.getState().edges.find((e) => e.id === '1-3')?.animated
      ).toBe(false);
    });
  });

  describe('auto send', () => {
    it('sends every 10 seconds once switched on', async () => {
      vi.useFakeTimers();
      renderProducer();

      fireEvent.click(screen.getByRole('switch'));
      expect(screen.getByText('On')).toBeInTheDocument();
      expect(adapter.put).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(10000);
      });
      await flushPromises();
      expect(adapter.put).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(10000);
      });
      await flushPromises();
      expect(adapter.put).toHaveBeenCalledTimes(2);
    });

    it('stops sending once switched off again', async () => {
      vi.useFakeTimers();
      renderProducer();
      fireEvent.click(screen.getByRole('switch'));
      fireEvent.click(screen.getByRole('switch'));

      act(() => {
        vi.advanceTimersByTime(30000);
      });
      await flushPromises();

      expect(adapter.put).not.toHaveBeenCalled();
    });

    it('does not send without a connected queue', async () => {
      vi.useFakeTimers();
      renderProducer('');

      fireEvent.click(screen.getByRole('switch'));
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      await flushPromises();

      expect(adapter.put).not.toHaveBeenCalled();
    });

    it('closes the producer connection after each automatic send', async () => {
      vi.useFakeTimers();
      renderProducer();
      fireEvent.click(screen.getByRole('switch'));
      adapter.closeProducer.mockClear();

      act(() => {
        vi.advanceTimersByTime(10000);
      });
      await flushPromises();

      expect(adapter.closeProducer).toHaveBeenCalledTimes(1);
    });
  });

  describe('connection handling', () => {
    it('closes the producer connection when there is no connected queue', () => {
      renderProducer('');

      expect(adapter.closeProducer).toHaveBeenCalledTimes(1);
    });

    it('keeps the connection open while a queue is connected', () => {
      renderProducer();

      expect(adapter.closeProducer).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('removes the node from the store', async () => {
      const user = userEvent.setup();
      renderProducer();

      await user.click(
        screen.getByRole('button', { name: 'Delete Producer app' })
      );

      expect(
        useStore.getState().nodes.find((n) => n.id === PRODUCER_ID)
      ).toBeUndefined();
    });
  });

  // The coding challenge build shows a cash sender: sender name, amount and
  // currency. The flag is read when the node renders, so each test sets it first.
  describe('coding challenge', () => {
    const getChallengeSendButton = () =>
      screen.getByRole('button', { name: 'Send cash' });

    beforeEach(() => {
      process.env.REACT_APP_IS_FOR_CODING_CHALLENGE = 'true';
    });

    afterEach(() => {
      process.env.REACT_APP_IS_FOR_CODING_CHALLENGE = 'false';
    });

    it('shows the cash sender form with a random sender name', () => {
      const random = vi.spyOn(Math, 'random').mockReturnValue(0);
      renderProducer();
      random.mockRestore();

      expect(screen.getByLabelText('Name of your sender')).toHaveValue(
        'Alice Johnson'
      );
      expect(screen.getByRole('spinbutton')).toHaveValue(5);
      expect(getChallengeSendButton()).toBeEnabled();
      expect(screen.getByText(/Total sent:/)).toHaveTextContent(
        'Total sent: 0'
      );
      expect(
        screen.queryByRole('button', { name: 'Create booking' })
      ).not.toBeInTheDocument();
    });

    it('lets the user rename the sender', async () => {
      const user = userEvent.setup();
      renderProducer();

      const input = screen.getByLabelText('Name of your sender');
      await user.clear(input);
      await user.type(input, 'Zed');

      expect(input).toHaveValue('Zed');
    });

    it('is disabled without a connected queue', () => {
      renderProducer('');

      expect(getChallengeSendButton()).toBeDisabled();
    });

    it('puts the amount in the default currency on the queue', async () => {
      const user = userEvent.setup();
      renderProducer();

      await user.click(getChallengeSendButton());

      expect(adapter.put).toHaveBeenCalledTimes(1);
      expect(adapter.put).toHaveBeenCalledWith(5, 1, QUEUE_NAME, 'EUR');
    });

    it('counts one message sent and raises the queue depth by one', async () => {
      const user = userEvent.setup();
      renderProducer();

      await user.click(getChallengeSendButton());

      expect(screen.getByText(/Total sent:/)).toHaveTextContent(
        'Total sent: 1'
      );
      expect(useStore.getState().localDepths[QUEUE_ID]).toBe(1);
    });

    it('sends the amount the user entered', async () => {
      const user = userEvent.setup();
      renderProducer();
      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '20');

      await user.click(getChallengeSendButton());

      expect(adapter.put).toHaveBeenCalledWith(20, 1, QUEUE_NAME, 'EUR');
    });

    it('sends in the currency the user picked', async () => {
      const user = userEvent.setup();
      renderProducer();

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'USD' }));
      await user.click(getChallengeSendButton());

      expect(adapter.put).toHaveBeenCalledWith(5, 1, QUEUE_NAME, 'USD');
    });

    it('is disabled when the amount is not positive', async () => {
      const user = userEvent.setup();
      renderProducer();

      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '0');

      expect(getChallengeSendButton()).toBeDisabled();
    });

    it('animates the outgoing edge and disables itself for 1.8 seconds', async () => {
      vi.useFakeTimers();
      renderProducer();

      fireEvent.click(getChallengeSendButton());
      await flushPromises();

      expect(getChallengeSendButton()).toBeDisabled();
      expect(
        useStore.getState().edges.find((e) => e.id === '1-3')?.animated
      ).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1800);
      });

      expect(getChallengeSendButton()).toBeEnabled();
    });

    it('has no auto send switch', () => {
      renderProducer();

      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });

    it('removes the node and closes the producer connection on delete', async () => {
      const user = userEvent.setup();
      renderProducer();
      adapter.closeProducer.mockClear();

      await user.click(
        screen.getByRole('button', { name: 'Delete Producer app' })
      );

      expect(
        useStore.getState().nodes.find((n) => n.id === PRODUCER_ID)
      ).toBeUndefined();
      expect(adapter.closeProducer).toHaveBeenCalledTimes(1);
    });
  });
});
