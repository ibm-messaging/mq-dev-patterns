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
import { toast } from 'react-toastify';
import RequestorNode from './Requestor.node';
import useStore from '../MQPatterns/RequestResponse/store';
import type { ProducerFlowNode } from '../../types';

const { dynPut, getDyn } = vi.hoisted(() => ({
  dynPut: vi.fn(),
  getDyn: vi.fn(),
}));

vi.mock('../../adapters/API.adapter', () => ({
  default: class {
    dynPut = dynPut;
    getDyn = getDyn;
  },
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const NODE_ID = 'requestor-1';

const renderNode = (overrides?: Partial<ProducerFlowNode['data']>) =>
  render(
    <ReactFlowProvider>
      <RequestorNode
        id={NODE_ID}
        type="producer"
        selected={false}
        dragging={false}
        draggable
        selectable
        deletable
        zIndex={0}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
        isConnectable
        data={{
          role: 'Producer',
          label: 'Participants checker',
          connectedQueue: 'DEV.QUEUE.3',
          isActive: false,
          ...overrides,
        }}
      />
    </ReactFlowProvider>
  );

describe('RequestorNode', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    useStore.setState(useStore.getInitialState());
    dynPut.mockReset();
    getDyn.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the name input, quantity input and submit button', () => {
    renderNode();

    expect(
      screen.getByRole('textbox', { name: 'Name of your application' })
    ).toHaveValue('Participants checker');
    expect(
      screen.getByRole('spinbutton', { name: 'Request quantity' })
    ).toHaveValue(1);
    expect(
      screen.getByRole('button', { name: 'Submit request' })
    ).toBeEnabled();
  });

  it('disables submit when no queue is connected', () => {
    renderNode({ connectedQueue: '' });

    expect(
      screen.getByRole('button', { name: 'Submit request' })
    ).toBeDisabled();
  });

  it('increments and decrements the quantity with the steppers', async () => {
    renderNode();
    const quantity = screen.getByRole('spinbutton', {
      name: 'Request quantity',
    });

    await userEvent.click(
      screen.getByRole('button', { name: /increment number/i })
    );
    expect(quantity).toHaveValue(2);

    await userEvent.click(
      screen.getByRole('button', { name: /decrement number/i })
    );
    expect(quantity).toHaveValue(1);
  });

  it('sends a request, draws the reply queue and shows the waiting state', async () => {
    dynPut.mockResolvedValue({ _name: 'amq.reply.1' });
    const creteTmpQueue = vi.fn();
    const drawTmpConnection = vi.fn();
    useStore.setState({ creteTmpQueue, drawTmpConnection });
    renderNode();

    await userEvent.click(
      screen.getByRole('button', { name: 'Submit request' })
    );

    expect(dynPut).toHaveBeenCalledWith(
      'Request',
      1,
      'DEV.QUEUE.3',
      'DYNPUT',
      NODE_ID,
      expect.anything()
    );
    expect(toast.success).toHaveBeenCalledWith('The request has been sent!');
    expect(creteTmpQueue).toHaveBeenCalledWith('amq.reply.1', NODE_ID);
    expect(drawTmpConnection).toHaveBeenCalledWith(
      'DEV.QUEUE.3',
      NODE_ID,
      false
    );
    expect(
      await screen.findByRole('button', { name: 'Waiting for reply…' })
    ).toBeDisabled();
  });

  it('does not enter the waiting state when the request fails', async () => {
    dynPut.mockResolvedValue(-1);
    renderNode();

    await userEvent.click(
      screen.getByRole('button', { name: 'Submit request' })
    );

    expect(toast.success).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Submit request' })
    ).toBeEnabled();
  });

  it('polls for the reply and shows the response once it arrives', async () => {
    dynPut.mockResolvedValue({ _name: 'amq.reply.1' });
    getDyn.mockResolvedValueOnce(undefined).mockResolvedValueOnce('42 EUR');
    const deleteTmpQueue = vi.fn();
    useStore.setState({ deleteTmpQueueFromTmpQueueName: deleteTmpQueue });
    renderNode();

    await userEvent.click(
      screen.getByRole('button', { name: 'Submit request' })
    );
    await screen.findByRole('button', { name: 'Waiting for reply…' });

    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    expect(getDyn).toHaveBeenLastCalledWith(
      1,
      'amq.reply.1',
      NODE_ID,
      'DYNPUT'
    );
    expect(screen.queryByText(/Response:/)).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    expect(await screen.findByText('42 EUR')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith(
      'Response received successfully!'
    );
    expect(deleteTmpQueue).toHaveBeenCalledWith('amq.reply.1');
    expect(
      screen.getByRole('button', { name: 'Submit request' })
    ).toBeEnabled();
  });
});
