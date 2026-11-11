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
import ResponderNode from './Responder.node';
import useStore from '../MQPatterns/RequestResponse/store';
import type { ConsumerFlowNode } from '../../types';

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

const NODE_ID = 'responder-1';

const renderNode = (overrides?: Partial<ConsumerFlowNode['data']>) =>
  render(
    <ReactFlowProvider>
      <ResponderNode
        id={NODE_ID}
        type="consumer"
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
          role: 'Consumer',
          label: 'Participant confirmation',
          connectedQueue: 'DEV.QUEUE.3',
          isActive: false,
          ...overrides,
        }}
      />
    </ReactFlowProvider>
  );

describe('ResponderNode', () => {
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

  it('shows Idle status and empty stats when inactive', () => {
    renderNode();

    expect(screen.getByText('Idle')).toBeInTheDocument();
    expect(
      screen.getByText('Reply queue').nextElementSibling
    ).toHaveTextContent('—');
  });

  it('shows Listening status when active', () => {
    renderNode({ isActive: true });

    expect(screen.getByText('Listening')).toBeInTheDocument();
  });

  it('disables the header toggle when no queue is connected', () => {
    renderNode({ connectedQueue: '' });

    expect(screen.getByRole('switch', { hidden: true })).toBeDisabled();
  });

  it('toggles listening through the store onClick action', async () => {
    const onClick = vi.fn();
    useStore.setState({ onClick });
    renderNode();

    await userEvent.click(screen.getByRole('switch', { hidden: true }));

    expect(onClick).toHaveBeenCalledWith(NODE_ID);
  });

  it('keeps Send reply disabled until a request has arrived', () => {
    renderNode({ isActive: true });

    expect(screen.getByRole('button', { name: 'Send reply' })).toBeDisabled();
  });

  it('polls the queue while active and handles an incoming request', async () => {
    getDyn.mockResolvedValue({
      message: { Message: 'Is Alice registered?' },
      replyQueue: 'amq.reply.7',
    });
    const drainMessageFromQueue = vi.fn();
    const drawTmpConnection = vi.fn();
    useStore.setState({ drainMessageFromQueue, drawTmpConnection });
    renderNode({ isActive: true });

    await act(async () => {
      vi.advanceTimersByTime(1800);
    });

    expect(getDyn).toHaveBeenCalledWith(
      1,
      'DEV.QUEUE.3',
      expect.any(String),
      'DYNREP'
    );
    expect(drainMessageFromQueue).toHaveBeenCalledWith(NODE_ID);
    expect(drawTmpConnection).toHaveBeenCalledWith(
      'amq.reply.7',
      NODE_ID,
      true
    );
    expect(toast.success).toHaveBeenCalledWith(
      'Message received! It is time to reply!'
    );
    expect(await screen.findByText('Is Alice registered?')).toBeInTheDocument();
    expect(screen.getByText('amq.reply.7')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send reply' })).toBeEnabled();
  });

  it('does not poll while inactive', async () => {
    renderNode({ isActive: false });

    await act(async () => {
      vi.advanceTimersByTime(3600);
    });

    expect(getDyn).not.toHaveBeenCalled();
  });

  it('sends the reply, clears the reply queue and removes the temporary edge', async () => {
    getDyn.mockResolvedValue({
      message: { Message: 'Is Alice registered?' },
      replyQueue: 'amq.reply.7',
    });
    dynPut.mockResolvedValue({ _name: 'ok' });
    const animateTmpConnection = vi.fn();
    const deleteEdgeFromConnection = vi.fn();
    useStore.setState({ animateTmpConnection, deleteEdgeFromConnection });
    renderNode({ isActive: true });

    await act(async () => {
      vi.advanceTimersByTime(1800);
    });
    await screen.findByText('Is Alice registered?');

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Reply message' }),
      'Yes'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send reply' }));

    expect(animateTmpConnection).toHaveBeenCalledWith('amq.reply.7', NODE_ID);
    expect(dynPut).toHaveBeenCalledWith(
      'Yes',
      1,
      'amq.reply.7',
      'DYNREP',
      NODE_ID
    );
    const replyQueueRow = screen
      .getByText('Reply queue')
      .closest('.node-card__stat-row') as HTMLElement;
    expect(replyQueueRow).toHaveTextContent('—');
    expect(deleteEdgeFromConnection).toHaveBeenCalledWith(
      'amq.reply.7',
      NODE_ID
    );
    expect(toast.success).toHaveBeenCalledWith('Your response has been sent!');
    expect(screen.getByRole('textbox', { name: 'Reply message' })).toHaveValue(
      ''
    );
  });

  it('shows an error toast when the reply cannot be sent', async () => {
    getDyn.mockResolvedValue({
      message: { Message: 'Is Alice registered?' },
      replyQueue: 'amq.reply.7',
    });
    dynPut.mockRejectedValue(new Error('network'));
    renderNode({ isActive: true });

    await act(async () => {
      vi.advanceTimersByTime(1800);
    });
    await screen.findByText('Is Alice registered?');

    await userEvent.click(screen.getByRole('button', { name: 'Send reply' }));

    expect(toast.error).toHaveBeenCalledWith('Error on sending your response.');
    expect(toast.success).not.toHaveBeenCalledWith(
      'Your response has been sent!'
    );
  });
});
