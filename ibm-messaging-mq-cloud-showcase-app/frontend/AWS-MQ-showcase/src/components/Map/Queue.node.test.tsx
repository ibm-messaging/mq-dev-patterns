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
import { toast } from 'react-toastify';
import QueueNode from './Queue.node';
import useStore from '../MQPatterns/PointToPoint/store';
import type { QueueFlowNode } from '../../types';

const adapter = vi.hoisted(() => ({
  getAllDepths: vi.fn(),
}));

vi.mock('../../adapters/API.adapter', () => ({
  default: class {
    getAllDepths = adapter.getAllDepths;
  },
}));

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn() },
}));

const QUEUE_NAME = 'DEV.QUEUE.1';
const QUEUE_ID = '3';

type QueueData = QueueFlowNode['data'];

function buildProps(data: Partial<QueueData> = {}): NodeProps<QueueFlowNode> {
  return {
    id: QUEUE_ID,
    type: 'queue',
    data: { role: 'q', depth: 0, queueName: QUEUE_NAME, ...data },
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
}

const tree = (data?: Partial<QueueData>) => (
  <ReactFlowProvider>
    <QueueNode {...buildProps(data)} />
  </ReactFlowProvider>
);

const renderQueue = (data?: Partial<QueueData>) => render(tree(data));

/** Advances fake timers and lets the awaited poll finish. */
const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const getInfoButton = () =>
  screen.queryByRole('button', { name: 'Messages waiting in queue' });

describe('QueueNode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useStore.setState(useStore.getInitialState(), true);
    adapter.getAllDepths.mockResolvedValue([
      { name: QUEUE_NAME, depth: 0, maxDepth: 5000 },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('shows the queue name, the label and an empty depth', () => {
      renderQueue();

      expect(screen.getByText('QUEUE')).toBeInTheDocument();
      expect(screen.getByText(QUEUE_NAME)).toBeInTheDocument();
      expect(screen.getByText('0 / 5000 msgs')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('labels a reply queue differently', () => {
      renderQueue({ queueName: 'APP.REPLIES.1' });

      expect(screen.getByText('REPLY QUEUE')).toBeInTheDocument();
    });

    it('has no info button while the queue is empty', () => {
      renderQueue();

      expect(getInfoButton()).not.toBeInTheDocument();
    });

    it('removes the queue and its edges when deleted', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      renderQueue();

      await user.click(screen.getByRole('button', { name: 'Delete Queue' }));

      const state = useStore.getState();
      expect(state.nodes.find((n) => n.id === QUEUE_ID)).toBeUndefined();
      expect(state.edges).toEqual([]);
    });
  });

  describe('polling', () => {
    it('does not poll before the first 3 seconds', async () => {
      renderQueue();

      await advance(2999);

      expect(adapter.getAllDepths).not.toHaveBeenCalled();
    });

    it('polls the depths every 3 seconds', async () => {
      renderQueue();

      await advance(3000);
      expect(adapter.getAllDepths).toHaveBeenCalledTimes(1);
      expect(adapter.getAllDepths).toHaveBeenCalledWith(false);

      await advance(3000);
      expect(adapter.getAllDepths).toHaveBeenCalledTimes(2);
    });

    it('stops polling when the node is removed', async () => {
      const { unmount } = renderQueue();
      await advance(3000);
      adapter.getAllDepths.mockClear();

      unmount();
      await advance(9000);

      expect(adapter.getAllDepths).not.toHaveBeenCalled();
    });

    it('shows the depth and max depth reported for this queue', async () => {
      adapter.getAllDepths.mockResolvedValue([
        { name: 'OTHER.QUEUE', depth: 99, maxDepth: 10 },
        { name: QUEUE_NAME, depth: 7, maxDepth: 100 },
      ]);
      renderQueue();

      await advance(3000);

      expect(screen.getByText('7 / 100 msgs')).toBeInTheDocument();
      expect(screen.getByText('Max depth:').parentElement).toHaveTextContent(
        'Max depth: 100'
      );
    });

    it('keeps the default max depth when the API does not send one', async () => {
      adapter.getAllDepths.mockResolvedValue([{ name: QUEUE_NAME, depth: 2 }]);
      renderQueue();

      await advance(3000);

      expect(screen.getByText('2 / 5000 msgs')).toBeInTheDocument();
    });

    it('stores the depths in the store', async () => {
      const depths = [{ name: QUEUE_NAME, depth: 4, maxDepth: 5000 }];
      adapter.getAllDepths.mockResolvedValue(depths);
      renderQueue();

      await advance(3000);

      const state = useStore.getState();
      expect(state.queueData).toEqual(depths);
      expect(state.nodeDepths[QUEUE_ID]).toBe(4);
      expect(state.localDepths[QUEUE_ID]).toBe(4);
    });

    it('ignores a response that has no entry for this queue', async () => {
      adapter.getAllDepths.mockResolvedValue([
        { name: 'OTHER.QUEUE', depth: 3 },
      ]);
      renderQueue();

      await advance(3000);

      expect(screen.getByText('0 / 5000 msgs')).toBeInTheDocument();
      expect(useStore.getState().queueData).toEqual([]);
    });

    it('animates the outgoing edge for a second when the depth drops', async () => {
      adapter.getAllDepths.mockResolvedValueOnce([
        { name: QUEUE_NAME, depth: 5 },
      ]);
      adapter.getAllDepths.mockResolvedValue([{ name: QUEUE_NAME, depth: 4 }]);
      renderQueue();
      const edgeAnimated = () =>
        useStore.getState().edges.find((e) => e.id === '3-2')?.animated;

      await advance(3000);
      expect(edgeAnimated()).toBe(false);

      await advance(3000);
      expect(edgeAnimated()).toBe(true);

      await advance(1000);
      expect(edgeAnimated()).toBe(false);
    });

    it('does not animate when the depth grows', async () => {
      adapter.getAllDepths.mockResolvedValueOnce([
        { name: QUEUE_NAME, depth: 1 },
      ]);
      adapter.getAllDepths.mockResolvedValue([{ name: QUEUE_NAME, depth: 3 }]);
      renderQueue();

      await advance(6000);

      expect(
        useStore.getState().edges.find((e) => e.id === '3-2')?.animated
      ).toBe(false);
    });
  });

  describe('error toasts', () => {
    it('tells the user the queue manager is unreachable on 525', async () => {
      adapter.getAllDepths.mockResolvedValue(525);
      renderQueue();

      await advance(3000);

      expect(toast.error).toHaveBeenCalledWith(
        'The queue manager is not reachable.'
      );
    });

    it('tells the user the backend is unreachable on 505', async () => {
      adapter.getAllDepths.mockResolvedValue(505);
      renderQueue();

      await advance(3000);

      expect(toast.error).toHaveBeenCalledWith(
        'The backend server is not reachable.'
      );
    });

    it('keeps polling after an error', async () => {
      adapter.getAllDepths.mockResolvedValueOnce(505);
      adapter.getAllDepths.mockResolvedValue([{ name: QUEUE_NAME, depth: 6 }]);
      renderQueue();

      await advance(6000);

      expect(adapter.getAllDepths).toHaveBeenCalledTimes(2);
      expect(screen.getByText('6 / 5000 msgs')).toBeInTheDocument();
    });

    it('keeps polling when the adapter throws', async () => {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      adapter.getAllDepths.mockRejectedValueOnce(new Error('boom'));
      renderQueue();

      await advance(6000);

      expect(log).toHaveBeenCalled();
      expect(adapter.getAllDepths).toHaveBeenCalledTimes(2);
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('local depth', () => {
    it('shows the depth held in the store instead of the polled one', () => {
      renderQueue();

      act(() => useStore.getState().sendMessages('1', 3));

      expect(screen.getByText('3 / 5000 msgs')).toBeInTheDocument();
    });
  });

  describe('info popover', () => {
    it('shows the info button once the queue holds messages', () => {
      renderQueue();

      act(() => useStore.getState().setNodeDepth(QUEUE_ID, 2));

      expect(getInfoButton()).toBeInTheDocument();
    });

    it('opens automatically when a message lands', () => {
      const { rerender } = renderQueue();
      act(() => useStore.getState().setNodeDepth(QUEUE_ID, 1));

      rerender(tree({ landCount: 1 }));

      expect(getInfoButton()).toHaveAttribute('aria-expanded', 'true');
    });

    it('says one message is waiting, in the singular', () => {
      const { rerender } = renderQueue();
      act(() => useStore.getState().setNodeDepth(QUEUE_ID, 1));
      rerender(tree({ landCount: 1 }));

      expect(screen.getByText(/^There (is|are)/)).toHaveTextContent(
        'There is 1 message waiting in DEV.QUEUE.1'
      );
    });

    it('uses the plural for several messages', () => {
      renderQueue();

      act(() => useStore.getState().sendMessages('1', 3));

      expect(screen.getByText(/^There (is|are)/)).toHaveTextContent(
        'There are 3 messages waiting in DEV.QUEUE.1'
      );
    });

    it('closes with the close button and stays closed for later messages', () => {
      const { rerender } = renderQueue();
      act(() => useStore.getState().setNodeDepth(QUEUE_ID, 1));
      rerender(tree({ landCount: 1 }));

      act(() => screen.getByRole('button', { name: 'Close' }).click());
      expect(getInfoButton()).toHaveAttribute('aria-expanded', 'false');

      rerender(tree({ landCount: 2 }));
      expect(getInfoButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('toggles from the info button', () => {
      const { rerender } = renderQueue();
      act(() => useStore.getState().setNodeDepth(QUEUE_ID, 1));
      rerender(tree({ landCount: 1 }));

      act(() => getInfoButton()?.click());
      expect(getInfoButton()).toHaveAttribute('aria-expanded', 'false');

      act(() => getInfoButton()?.click());
      expect(getInfoButton()).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes and hides the button once the queue is drained', () => {
      const { rerender } = renderQueue();
      act(() => useStore.getState().setNodeDepth(QUEUE_ID, 1));
      rerender(tree({ landCount: 1 }));
      expect(getInfoButton()).toBeInTheDocument();

      act(() => useStore.getState().setNodeDepth(QUEUE_ID, 0));

      expect(getInfoButton()).not.toBeInTheDocument();
    });

    it('closes when the drain counter increases', () => {
      const { rerender } = renderQueue();
      act(() => useStore.getState().setNodeDepth(QUEUE_ID, 2));
      rerender(tree({ landCount: 1 }));
      expect(getInfoButton()).toHaveAttribute('aria-expanded', 'true');

      rerender(tree({ landCount: 1, drainCount: 1 }));

      expect(getInfoButton()).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
