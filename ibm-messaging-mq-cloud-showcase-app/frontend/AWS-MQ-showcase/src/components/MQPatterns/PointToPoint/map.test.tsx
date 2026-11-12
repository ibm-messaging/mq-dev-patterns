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

import { act, fireEvent, render, waitFor } from '@testing-library/react';
import Flow from './map';
import useStore from './store';

vi.mock('../../../adapters/API.adapter', () => ({
  default: class {
    put = vi.fn();
    closeProducer = vi.fn();
    closeConsumer = vi.fn();
    getFromLimit = vi.fn().mockResolvedValue([]);
    getAllDepths = vi.fn().mockResolvedValue([]);
  },
}));

const drop = (container: HTMLElement, type?: string) => {
  const canvas = container.querySelector('.react-flow') as HTMLElement;
  fireEvent.drop(canvas, {
    clientX: 300,
    clientY: 200,
    dataTransfer: {
      getData: (format: string) =>
        format === 'application/reactflow' ? (type ?? '') : '',
    },
  });
};

const nodesOfType = (type: string) =>
  useStore.getState().nodes.filter((n) => n.type === type);

const renderFlow = async () => {
  const view = render(<Flow />);
  // The drop is ignored until React Flow has initialised and drawn the nodes.
  await waitFor(() =>
    expect(view.container.querySelectorAll('.react-flow__node')).toHaveLength(3)
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return view;
};

describe('PointToPoint canvas', () => {
  beforeEach(() => {
    window.innerWidth = 1200;
    useStore.setState(useStore.getInitialState(), true);
  });

  describe('rendering', () => {
    it('shows the sidebar next to the canvas', async () => {
      const { getByText } = await renderFlow();

      expect(getByText('Add elements')).toBeInTheDocument();
    });

    it('shows the producer, the queue and the consumer of the default graph', async () => {
      const { container } = await renderFlow();

      await waitFor(() =>
        expect(container.querySelectorAll('.react-flow__node')).toHaveLength(3)
      );
      expect(
        container.querySelector('.react-flow__node-producer')
      ).toBeTruthy();
      expect(container.querySelector('.react-flow__node-queue')).toBeTruthy();
      expect(
        container.querySelector('.react-flow__node-consumer')
      ).toBeTruthy();
    });
  });

  describe('dropping onto the canvas', () => {
    it('adds a producer that is not connected to any queue', async () => {
      const { container } = await renderFlow();

      drop(container, 'producer');

      const producers = nodesOfType('producer');
      expect(producers).toHaveLength(2);
      expect(producers[1].data).toMatchObject({
        role: 'Producer',
        label: 'Producer Name',
        connectedQueue: '',
        isActive: false,
      });
    });

    it('adds a consumer that is not connected and not receiving', async () => {
      const { container } = await renderFlow();

      drop(container, 'consumer');

      const consumers = nodesOfType('consumer');
      expect(consumers).toHaveLength(2);
      expect(consumers[1].data).toMatchObject({
        role: 'Consumer',
        label: 'Consumer Name',
        connectedQueue: '',
        isActive: false,
      });
    });

    it('gives every dropped node its own id', async () => {
      const { container } = await renderFlow();

      drop(container, 'producer');
      drop(container, 'producer');
      drop(container, 'consumer');

      const ids = useStore.getState().nodes.map((n) => n.id);
      expect(ids).toHaveLength(6);
      expect(new Set(ids).size).toBe(6);
    });

    it('adds a second queue named after the first free name', async () => {
      const { container } = await renderFlow();

      drop(container, 'queue');

      const queues = nodesOfType('queue');
      expect(queues).toHaveLength(2);
      expect(queues[1].data).toMatchObject({
        role: 'q',
        depth: 0,
        queueName: 'DEV.QUEUE.2',
      });
    });

    it('reuses a name that was freed by deleting a queue', async () => {
      const { container } = await renderFlow();
      drop(container, 'queue');
      useStore.getState().onDeleteNode(nodesOfType('queue')[0].id, true);

      drop(container, 'queue');

      expect(nodesOfType('queue').map((q) => q.data.queueName)).toEqual([
        'DEV.QUEUE.2',
        'DEV.QUEUE.1',
      ]);
    });

    it('allows no more than two queues', async () => {
      const { container } = await renderFlow();

      drop(container, 'queue');
      drop(container, 'queue');

      expect(nodesOfType('queue')).toHaveLength(2);
    });

    it('ignores a drop that carries no node type', async () => {
      const { container } = await renderFlow();

      drop(container, undefined);

      expect(useStore.getState().nodes).toHaveLength(3);
    });

    it('ignores an unknown node type', async () => {
      const { container } = await renderFlow();

      drop(container, 'topic');

      expect(useStore.getState().nodes).toHaveLength(3);
    });

    it('shows a dropped node on the canvas', async () => {
      const { container } = await renderFlow();

      drop(container, 'producer');

      await waitFor(() =>
        expect(container.querySelectorAll('.react-flow__node')).toHaveLength(4)
      );
    });
  });

  describe('dragging over the canvas', () => {
    it('allows a drop by cancelling the default and setting the move effect', async () => {
      const { container } = await renderFlow();
      const canvas = container.querySelector('.react-flow') as HTMLElement;
      const dataTransfer = { dropEffect: '' };

      const notCancelled = fireEvent.dragOver(canvas, { dataTransfer });

      expect(notCancelled).toBe(false);
      expect(dataTransfer.dropEffect).toBe('move');
    });
  });
});
