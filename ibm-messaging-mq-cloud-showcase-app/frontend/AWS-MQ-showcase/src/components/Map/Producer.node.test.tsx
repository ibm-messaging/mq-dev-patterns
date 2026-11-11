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
});
