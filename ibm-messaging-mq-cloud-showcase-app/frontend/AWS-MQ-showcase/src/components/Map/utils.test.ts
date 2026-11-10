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

import MapUtils, {
  CURRENCY_ITEMS,
  EDGE_STYLE_THIN,
  bumpQueueCounter,
  emitMessageFlow,
  getQueueDepth,
  isQueueNode,
  patchNodeData,
} from './utils';
import type {
  ConsumerNodeData,
  MQFlowEdge,
  MQFlowNode,
  MessageFlowDetail,
  ProducerNodeData,
  QueueNodeData,
} from '../../types';

const position = { x: 0, y: 0 };

const producerNode = (
  id = 'p',
  data: Partial<ProducerNodeData> = {}
): MQFlowNode => ({
  id,
  type: 'producer',
  position,
  data: {
    role: 'Producer',
    label: 'Producer',
    connectedQueue: '',
    isActive: false,
    ...data,
  },
});

const consumerNode = (
  id = 'c',
  data: Partial<ConsumerNodeData> = {}
): MQFlowNode => ({
  id,
  type: 'consumer',
  position,
  data: {
    role: 'Consumer',
    label: 'Consumer',
    connectedQueue: '',
    isActive: false,
    ...data,
  },
});

const queueNode = (
  id = 'q',
  queueName = 'DEV.QUEUE.1',
  data: Partial<QueueNodeData> = {}
): MQFlowNode => ({
  id,
  type: 'queue',
  position,
  data: { role: 'q', depth: 0, queueName, ...data },
});

const edge = (source: string, target: string): MQFlowEdge => ({
  id: `${source}-${target}`,
  source,
  target,
});

interface Slice {
  nodes: MQFlowNode[];
  edges: MQFlowEdge[];
}

/** Minimal stand-in for the Zustand `set`/`get` pair the helpers expect. */
function createStore(nodes: MQFlowNode[], edges: MQFlowEdge[] = []) {
  let state: Slice = { nodes, edges };
  return {
    set: (partial: Partial<Slice> | ((s: Slice) => Partial<Slice>)) => {
      state = {
        ...state,
        ...(typeof partial === 'function' ? partial(state) : partial),
      };
    },
    get: () => state,
  };
}

const connection = (source: string, target: string) => ({
  source,
  target,
  sourceHandle: null,
  targetHandle: null,
});

describe('CURRENCY_ITEMS', () => {
  it('lists EUR, USD and GBP with unique ids', () => {
    expect(CURRENCY_ITEMS.map((c) => c.text)).toEqual(['EUR', 'USD', 'GBP']);
    expect(new Set(CURRENCY_ITEMS.map((c) => c.id)).size).toBe(3);
  });
});

describe('isQueueNode', () => {
  it('is true only for queue nodes', () => {
    expect(isQueueNode(queueNode())).toBe(true);
    expect(isQueueNode(producerNode())).toBe(false);
    expect(isQueueNode(consumerNode())).toBe(false);
    expect(isQueueNode(undefined)).toBe(false);
  });
});

describe('emitMessageFlow', () => {
  it('dispatches an mq-message-flow window event for the edge', () => {
    const listener = vi.fn();
    window.addEventListener('mq-message-flow', listener);

    emitMessageFlow('p-q');

    window.removeEventListener('mq-message-flow', listener);
    expect(listener).toHaveBeenCalledTimes(1);
    const { detail } = listener.mock
      .calls[0][0] as CustomEvent<MessageFlowDetail>;
    expect(detail.edgeId).toBe('p-q');
    expect(typeof detail.id).toBe('string');
    expect(detail.reverse).toBeUndefined();
  });
});

describe('patchNodeData', () => {
  it('merges the patch into the matching node without mutating the input', () => {
    const nodes = [producerNode('p'), consumerNode('c')];

    const result = patchNodeData(nodes, 'p', { connectedQueue: 'DEV.QUEUE.1' });

    expect(result[0].data).toMatchObject({
      label: 'Producer',
      connectedQueue: 'DEV.QUEUE.1',
    });
    expect(result[1]).toBe(nodes[1]);
    expect(nodes[0].data.connectedQueue).toBe('');
  });
});

describe('bumpQueueCounter', () => {
  it('increments landCount from undefined and then onwards', () => {
    const first = bumpQueueCounter([queueNode()], 'q', 'landCount');
    const second = bumpQueueCounter(first, 'q', 'landCount');

    expect(first[0].data).toMatchObject({ landCount: 1 });
    expect(second[0].data).toMatchObject({ landCount: 2 });
  });

  it('increments drainCount independently of landCount', () => {
    const result = bumpQueueCounter(
      [queueNode('q', 'DEV.QUEUE.1', { landCount: 4 })],
      'q',
      'drainCount'
    );

    expect(result[0].data).toMatchObject({ landCount: 4, drainCount: 1 });
  });

  it('returns the same array for a non-queue or unknown node', () => {
    const nodes = [producerNode('p'), queueNode('q')];

    expect(bumpQueueCounter(nodes, 'p', 'landCount')).toBe(nodes);
    expect(bumpQueueCounter(nodes, 'missing', 'landCount')).toBe(nodes);
  });
});

describe('getQueueDepth', () => {
  it('prefers the local depth, then the API depth, then the fallback', () => {
    expect(
      getQueueDepth({ localDepths: { q: 2 }, nodeDepths: { q: 9 } }, 'q', 7)
    ).toBe(2);
    expect(
      getQueueDepth({ localDepths: {}, nodeDepths: { q: 9 } }, 'q', 7)
    ).toBe(9);
    expect(getQueueDepth({ localDepths: {}, nodeDepths: {} }, 'q', 7)).toBe(7);
    expect(getQueueDepth({ localDepths: {}, nodeDepths: {} }, 'q')).toBe(0);
  });

  it('treats a local depth of 0 as a real value', () => {
    expect(
      getQueueDepth({ localDepths: { q: 0 }, nodeDepths: { q: 9 } }, 'q')
    ).toBe(0);
  });
});

describe('MapUtils', () => {
  const utils = new MapUtils();

  describe('updateConnectionNodeToQueue', () => {
    it('connects a producer (source) to a queue (target)', () => {
      const store = createStore([producerNode('p'), queueNode('q')]);

      const ok = utils.updateConnectionNodeToQueue(
        store.set,
        store.get,
        connection('p', 'q')
      );

      expect(ok).toBe(true);
      expect(store.get().nodes[0].data).toMatchObject({
        connectedQueue: 'DEV.QUEUE.1',
        subscriptionState: 0,
      });
    });

    it('connects a consumer (target) to a queue (source)', () => {
      const store = createStore([
        queueNode('q', 'DEV.QUEUE.2'),
        consumerNode(),
      ]);

      const ok = utils.updateConnectionNodeToQueue(
        store.set,
        store.get,
        connection('q', 'c')
      );

      expect(ok).toBe(true);
      expect(store.get().nodes[1].data).toMatchObject({
        connectedQueue: 'DEV.QUEUE.2',
      });
    });

    it('rejects queue-to-queue and app-to-app connections', () => {
      const store = createStore([
        queueNode('q1'),
        queueNode('q2'),
        producerNode('p'),
        consumerNode('c'),
      ]);
      const before = store.get().nodes;

      expect(
        utils.updateConnectionNodeToQueue(
          store.set,
          store.get,
          connection('q1', 'q2')
        )
      ).toBe(false);
      expect(
        utils.updateConnectionNodeToQueue(
          store.set,
          store.get,
          connection('p', 'c')
        )
      ).toBe(false);
      expect(store.get().nodes).toBe(before);
    });
  });

  describe('disabledNonConnetedQueue', () => {
    it('disconnects the replaced node and refreshes the new neighbour edges', () => {
      const store = createStore(
        [
          queueNode('q1'),
          consumerNode('c', { connectedQueue: 'DEV.QUEUE.1', isActive: true }),
          consumerNode('c2', { connectedQueue: 'DEV.QUEUE.1', isActive: true }),
        ],
        [edge('q1', 'c'), edge('q1', 'c2')]
      );

      utils.disabledNonConnetedQueue(
        store.set,
        store.get,
        edge('q1', 'c'),
        connection('q1', 'c2')
      );

      expect(store.get().nodes[1].data).toMatchObject({
        isActive: false,
        connectedQueue: '',
      });
      const [untouched, refreshed] = store.get().edges;
      expect(untouched.animated).toBeUndefined();
      expect(refreshed.animated).toBe(true);
    });

    it('leaves edges alone when the new neighbour is a queue', () => {
      const store = createStore(
        [
          producerNode('p', { connectedQueue: 'DEV.QUEUE.1' }),
          queueNode('q1'),
          queueNode('q2'),
        ],
        [edge('p', 'q1')]
      );
      const before = store.get().edges;

      utils.disabledNonConnetedQueue(
        store.set,
        store.get,
        edge('p', 'q1'),
        connection('p', 'q2')
      );

      expect(store.get().edges).toBe(before);
    });
  });

  describe('edge animation', () => {
    const nodes = [producerNode('p'), queueNode('q'), consumerNode('c')];
    const edges = [edge('p', 'q'), edge('q', 'c')];

    it('animateEdgeFromNodeIds toggles edges touching the node', () => {
      const store = createStore(nodes, edges);

      utils.animateEdgeFromNodeIds(store.set, store.get, 'p');
      expect(store.get().edges[0].animated).toBe(true);
      expect(store.get().edges[1].animated).toBeUndefined();

      utils.animateEdgeFromNodeIds(store.set, store.get, 'p');
      expect(store.get().edges[0].animated).toBe(false);
    });

    it('animateEdgeFromProducer sets the state on outgoing edges', () => {
      const store = createStore(nodes, edges);

      utils.animateEdgeFromProducer(store.set, store.get, 'p', true);

      expect(store.get().edges[0].animated).toBe(true);
      expect(store.get().edges[0].style).toMatchObject({ strokeWidth: 1.5 });
      expect(store.get().edges[1].animated).toBeUndefined();
    });

    it('animateEdgeFromProducer can target an edge by id', () => {
      const store = createStore(nodes, edges);

      utils.animateEdgeFromProducer(store.set, store.get, 'q-c', true, true);

      expect(store.get().edges[1].animated).toBe(true);
      expect(store.get().edges[0].animated).toBeUndefined();
    });

    it('animateEdgeFromConnection animates the edge between two nodes in either direction', () => {
      const store = createStore(nodes, edges);

      utils.animateEdgeFromConnection(store.set, store.get, 'q', 'p');

      expect(store.get().edges[0].animated).toBe(true);
      expect(store.get().edges[1].animated).toBeUndefined();
    });
  });

  describe('setActiveNodeAndAnimateFromNodeId', () => {
    it('toggles isActive and animates connected edges to match', () => {
      const store = createStore(
        [queueNode('q'), consumerNode('c', { connectedQueue: 'DEV.QUEUE.1' })],
        [edge('q', 'c')]
      );

      utils.setActiveNodeAndAnimateFromNodeId(store.set, store.get, 'c');
      expect(store.get().nodes[1].data.isActive).toBe(true);
      expect(store.get().edges[0].animated).toBe(true);

      utils.setActiveNodeAndAnimateFromNodeId(store.set, store.get, 'c');
      expect(store.get().nodes[1].data.isActive).toBe(false);
      expect(store.get().edges[0].animated).toBe(false);
    });
  });

  describe('drawConnectionNodeToQueueFromConnection', () => {
    it('adds a custom edge with the thin style', () => {
      const store = createStore([producerNode('p'), queueNode('q')]);

      utils.drawConnectionNodeToQueueFromConnection(
        store.set,
        store.get,
        connection('p', 'q')
      );

      expect(store.get().edges).toEqual([
        {
          id: 'p-q',
          source: 'p',
          target: 'q',
          animated: false,
          style: EDGE_STYLE_THIN,
          type: 'custom',
        },
      ]);
    });
  });

  describe('updateQueueOnDeletingEdge', () => {
    const buildStore = () =>
      createStore([
        producerNode('p', { connectedQueue: 'DEV.QUEUE.1', isActive: true }),
        queueNode('q'),
        consumerNode('c', { connectedQueue: 'DEV.QUEUE.1', isActive: true }),
      ]);

    it('clears the connection on app nodes of the deleted edge only', () => {
      const store = buildStore();

      utils.updateQueueOnDeletingEdge(store.set, store.get, 'p-q');

      expect(store.get().nodes[0].data).toMatchObject({
        connectedQueue: '',
        isActive: false,
      });
      expect(store.get().nodes[1].data).toMatchObject({
        queueName: 'DEV.QUEUE.1',
      });
      expect(store.get().nodes[2].data).toMatchObject({
        connectedQueue: 'DEV.QUEUE.1',
        isActive: true,
      });
    });

    it('marks the node as unsubscribing when the edge is a subscription', () => {
      const store = buildStore();

      utils.updateQueueOnDeletingEdge(store.set, store.get, 'q-c', true);

      expect(store.get().nodes[2].data).toMatchObject({
        connectedQueue: '',
        isActive: false,
        subscriptionState: 2,
      });
    });
  });

  describe('getEdgesFromNode', () => {
    it('returns every edge where the node is source or target', () => {
      const store = createStore(
        [],
        [edge('p', 'q'), edge('q', 'c'), edge('x', 'y')]
      );

      const result = utils.getEdgesFromNode(store.set, store.get, 'q');

      expect(result.map((e) => e.id)).toEqual(['p-q', 'q-c']);
    });
  });
});
