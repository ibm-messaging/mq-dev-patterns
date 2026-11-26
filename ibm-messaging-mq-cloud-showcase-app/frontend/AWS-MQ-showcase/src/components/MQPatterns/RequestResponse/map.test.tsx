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

// Tests the request/response canvas (RequestResponse/map.tsx). It checks that
// it shows the sidebar and the three default nodes. It checks that dropping a
// requestor, a responder or a queue adds a node with its own id. It checks that
// queues take the first free name and that there is a limit of three queues. It
// checks that bad drops are ignored and that dragging over the canvas allows a
// drop. The node components are mocked.

import { act, fireEvent, render, waitFor } from '@testing-library/react';
import Flow from './map';
import useStore from './store';

vi.mock('../../Map/Requestor.node', () => ({
  default: () => <div data-testid="requestor-node" />,
}));
vi.mock('../../Map/Responder.node', () => ({
  default: () => <div data-testid="responder-node" />,
}));
vi.mock('../../Map/Queue.node', () => ({
  default: () => <div data-testid="queue-node" />,
}));
vi.mock('../../Map/Custom.edge', () => ({
  default: () => null,
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

const queueNames = () =>
  nodesOfType('queue').map((q) => (q.data as { queueName: string }).queueName);

const renderFlow = async () => {
  const view = render(<Flow />);
  // React Flow ignores a drop until it has drawn the nodes.
  await waitFor(() =>
    expect(view.container.querySelectorAll('.react-flow__node')).toHaveLength(3)
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return view;
};

describe('RequestResponse canvas', () => {
  beforeEach(() => {
    window.innerWidth = 1200;
    useStore.setState(useStore.getInitialState(), true);
  });

  describe('rendering', () => {
    it('shows the sidebar next to the canvas', async () => {
      const { getByText } = await renderFlow();

      expect(getByText('Add elements')).toBeInTheDocument();
    });

    it('shows the requestor, the queue and the responder of the default graph', async () => {
      const { container } = await renderFlow();

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
    // Keep this test first. New ids come from a counter that starts at 6 and is
    // shared by every test in this file. Once it reaches 17 a dropped node gets
    // the id of the default queue, and React Flow does not draw it.
    it('shows a dropped node on the canvas', async () => {
      const { container } = await renderFlow();

      drop(container, 'producer');

      await waitFor(() =>
        expect(container.querySelectorAll('.react-flow__node')).toHaveLength(4)
      );
    });

    it('adds a requestor that is not connected to any queue', async () => {
      const { container } = await renderFlow();

      drop(container, 'producer');

      const producers = nodesOfType('producer');
      expect(producers).toHaveLength(2);
      expect(producers[1].data).toMatchObject({
        role: 'Producer',
        connectedQueue: '',
        isActive: false,
      });
    });

    it('adds a responder that is not connected and not receiving', async () => {
      const { container } = await renderFlow();

      drop(container, 'consumer');

      const consumers = nodesOfType('consumer');
      expect(consumers).toHaveLength(2);
      expect(consumers[1].data).toMatchObject({
        role: 'Consumer',
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

    it('adds a queue named after the first free name', async () => {
      const { container } = await renderFlow();

      drop(container, 'queue');

      const queues = nodesOfType('queue');
      expect(queues).toHaveLength(2);
      expect(queues[1].data).toMatchObject({
        role: 'q',
        depth: 0,
        queueName: 'DEV.QUEUE.1',
      });
    });

    it('reuses a name that was freed by deleting a queue', async () => {
      const { container } = await renderFlow();
      drop(container, 'queue');
      drop(container, 'queue');
      expect(queueNames()).toEqual([
        'DEV.QUEUE.3',
        'DEV.QUEUE.1',
        'DEV.QUEUE.2',
      ]);
      useStore.getState().onDeleteNode(nodesOfType('queue')[1].id, true);

      drop(container, 'queue');

      expect(queueNames()).toEqual([
        'DEV.QUEUE.3',
        'DEV.QUEUE.2',
        'DEV.QUEUE.1',
      ]);
    });

    it('allows no more than three queues', async () => {
      const { container } = await renderFlow();

      drop(container, 'queue');
      drop(container, 'queue');
      drop(container, 'queue');

      expect(nodesOfType('queue')).toHaveLength(3);
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
