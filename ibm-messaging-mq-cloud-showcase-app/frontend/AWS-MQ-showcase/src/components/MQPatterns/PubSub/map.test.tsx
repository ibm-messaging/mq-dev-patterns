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

// Tests the publish-subscribe canvas (PubSub/map.tsx). It checks that it shows
// the sidebar and the nine default nodes. It checks that the connected
// subscribers subscribe to their topic. It checks that dropping a publisher, a
// subscriber or a topic adds a node with its own id. It checks that bad drops are
// ignored. The API adapter and the toast library are mocked.

import { act, fireEvent, render, waitFor } from '@testing-library/react';
import Flow from './map';
import useStore from './store';

vi.mock('../../../adapters/API.adapter', () => ({
  default: class {
    subscribe = vi.fn().mockResolvedValue({});
    unsubscribe = vi.fn().mockResolvedValue({});
    publish = vi.fn().mockResolvedValue({});
    getForSubFromAppId = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    promise: (promise: Promise<unknown>) => promise.catch(() => {}),
    success: vi.fn(),
  },
}));

const DEFAULT_NODE_COUNT = 9;

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
  // React Flow ignores a drop until it has drawn the nodes.
  await waitFor(() =>
    expect(view.container.querySelectorAll('.react-flow__node')).toHaveLength(
      DEFAULT_NODE_COUNT
    )
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return view;
};

describe('PubSub canvas', () => {
  beforeEach(() => {
    window.innerWidth = 1200;
    useStore.setState(useStore.getInitialState(), true);
  });

  describe('rendering', () => {
    it('shows the sidebar next to the canvas', async () => {
      const { getByText } = await renderFlow();

      expect(getByText('Add elements')).toBeInTheDocument();
    });

    it('shows the publishers, the topics and the subscribers of the default graph', async () => {
      const { container } = await renderFlow();

      expect(
        container.querySelectorAll('.react-flow__node-producer')
      ).toHaveLength(2);
      expect(
        container.querySelectorAll('.react-flow__node-queue')
      ).toHaveLength(3);
      expect(
        container.querySelectorAll('.react-flow__node-consumer')
      ).toHaveLength(4);
    });

    it('subscribes the connected subscribers to their topic', async () => {
      const { container } = await renderFlow();

      await waitFor(() =>
        expect(container.textContent).toContain(
          'Subscribed to: tickets/classic'
        )
      );
      expect(container.textContent).toContain('Subscribed to: tickets/VIP');
      expect(container.textContent).toContain('Subscribed to: tickets/#');
    });
  });

  describe('dropping onto the canvas', () => {
    it('adds a publisher that is not connected to any topic', async () => {
      const { container } = await renderFlow();

      drop(container, 'producer');

      const producers = nodesOfType('producer');
      expect(producers).toHaveLength(3);
      expect(producers[2].data).toMatchObject({
        role: 'Producer',
        label: 'Publisher',
        connectedQueue: '',
        isActive: false,
      });
    });

    it('adds a subscriber that is not connected and not subscribed', async () => {
      const { container } = await renderFlow();

      drop(container, 'consumer');

      const consumers = nodesOfType('consumer');
      expect(consumers).toHaveLength(5);
      expect(consumers[4].data).toMatchObject({
        role: 'Consumer',
        label: 'Subscriber',
        connectedQueue: '',
        subscriptionState: 0,
      });
    });

    it('adds a topic without a name', async () => {
      const { container } = await renderFlow();

      drop(container, 'queue');

      const topics = nodesOfType('queue');
      expect(topics).toHaveLength(4);
      expect(topics[3].data).toMatchObject({
        role: 'q',
        depth: 0,
        queueName: '',
      });
    });

    it('does not limit the number of topics', async () => {
      const { container } = await renderFlow();

      drop(container, 'queue');
      drop(container, 'queue');
      drop(container, 'queue');

      expect(nodesOfType('queue')).toHaveLength(6);
    });

    it('gives every dropped node its own id', async () => {
      const { container } = await renderFlow();

      drop(container, 'producer');
      drop(container, 'consumer');
      drop(container, 'queue');
      drop(container, 'queue');

      const ids = useStore.getState().nodes.map((n) => n.id);
      expect(ids).toHaveLength(DEFAULT_NODE_COUNT + 4);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('ignores a drop that carries no node type', async () => {
      const { container } = await renderFlow();

      drop(container, undefined);

      expect(useStore.getState().nodes).toHaveLength(DEFAULT_NODE_COUNT);
    });

    it('ignores an unknown node type', async () => {
      const { container } = await renderFlow();

      drop(container, 'router');

      expect(useStore.getState().nodes).toHaveLength(DEFAULT_NODE_COUNT);
    });

    it('shows a dropped node on the canvas', async () => {
      const { container } = await renderFlow();

      drop(container, 'producer');

      await waitFor(() =>
        expect(container.querySelectorAll('.react-flow__node')).toHaveLength(
          DEFAULT_NODE_COUNT + 1
        )
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
