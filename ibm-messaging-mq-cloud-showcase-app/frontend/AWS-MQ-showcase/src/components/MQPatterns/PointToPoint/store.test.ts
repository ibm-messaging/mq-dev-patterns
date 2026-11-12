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

import { Position } from '@xyflow/react';
import useStore from './store';
import type { MQFlowNode } from '../../../types';

// Ids from the default graph: 1 = producer, 2 = consumer, 3 = queue
// (DEV.QUEUE.1), edges '1-3' and '3-2'.
const PRODUCER_ID = '1';
const CONSUMER_ID = '2';
const QUEUE_ID = '3';

const getNode = (id: string) =>
  useStore.getState().nodes.find((node) => node.id === id);

const makeProducer = (id: string): MQFlowNode => ({
  id,
  type: 'producer',
  data: {
    role: 'Producer',
    label: `Producer ${id}`,
    connectedQueue: '',
    isActive: false,
  },
  position: { x: 0, y: 0 },
  sourcePosition: Position.Right,
});

const makeQueue = (id: string, queueName: string): MQFlowNode => ({
  id,
  type: 'queue',
  data: { role: 'q', depth: 0, queueName },
  position: { x: 0, y: 0 },
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
});

describe('PointToPoint store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useStore.setState(useStore.getInitialState(), true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('starts with the default graph and no depth information', () => {
      const state = useStore.getState();

      expect(state.nodes).toHaveLength(3);
      expect(state.edges).toHaveLength(2);
      expect(state.queueData).toEqual([]);
      expect(state.nodeDepths).toEqual({});
      expect(state.localDepths).toEqual({});
    });
  });

  describe('sendMessages', () => {
    it('increments the local depth of the connected queue straight away', () => {
      useStore.getState().sendMessages(PRODUCER_ID, 3);

      expect(useStore.getState().localDepths[QUEUE_ID]).toBe(3);
    });

    it('adds to the depth already reported by the API', () => {
      useStore.getState().setNodeDepth(QUEUE_ID, 4);

      useStore.getState().sendMessages(PRODUCER_ID, 2);

      expect(useStore.getState().localDepths[QUEUE_ID]).toBe(6);
    });

    it('does nothing when the node has no outgoing edge', () => {
      useStore.getState().sendMessages('unknown', 5);

      expect(useStore.getState().localDepths).toEqual({});
    });

    it('emits one message-flow event per message, one second apart', () => {
      const listener = vi.fn();
      window.addEventListener('mq-message-flow', listener);

      useStore.getState().sendMessages(PRODUCER_ID, 3);
      vi.advanceTimersByTime(0);
      expect(listener).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(1000);
      expect(listener).toHaveBeenCalledTimes(2);
      vi.advanceTimersByTime(1000);
      expect(listener).toHaveBeenCalledTimes(3);

      window.removeEventListener('mq-message-flow', listener);
      const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.edgeId).toBe('1-3');
    });

    it('bumps the queue landCount 950ms after each message is emitted', () => {
      useStore.getState().sendMessages(PRODUCER_ID, 2);

      vi.advanceTimersByTime(949);
      expect(getNode(QUEUE_ID)?.data).not.toHaveProperty('landCount');

      vi.advanceTimersByTime(1);
      expect(getNode(QUEUE_ID)?.data).toMatchObject({ landCount: 1 });

      vi.advanceTimersByTime(1000);
      expect(getNode(QUEUE_ID)?.data).toMatchObject({ landCount: 2 });
    });
  });

  describe('consumeMessageFromQueue', () => {
    it('decrements the local depth of the queue and emits a flow event', () => {
      const listener = vi.fn();
      window.addEventListener('mq-message-flow', listener);
      useStore.getState().setNodeDepth(QUEUE_ID, 3);

      useStore.getState().consumeMessageFromQueue(CONSUMER_ID);

      window.removeEventListener('mq-message-flow', listener);
      expect(useStore.getState().localDepths[QUEUE_ID]).toBe(2);
      expect(listener).toHaveBeenCalledTimes(1);
      expect((listener.mock.calls[0][0] as CustomEvent).detail.edgeId).toBe(
        '3-2'
      );
    });

    it('never lets the depth go below zero', () => {
      useStore.getState().setNodeDepth(QUEUE_ID, 1);

      useStore.getState().consumeMessageFromQueue(CONSUMER_ID);
      useStore.getState().consumeMessageFromQueue(CONSUMER_ID);
      useStore.getState().consumeMessageFromQueue(CONSUMER_ID);

      expect(useStore.getState().localDepths[QUEUE_ID]).toBe(0);
    });

    it('starts from 0 when the queue has no known depth', () => {
      useStore.getState().consumeMessageFromQueue(CONSUMER_ID);

      expect(useStore.getState().localDepths[QUEUE_ID]).toBe(0);
    });

    it('does nothing when the node has no inbound edge', () => {
      const listener = vi.fn();
      window.addEventListener('mq-message-flow', listener);

      useStore.getState().consumeMessageFromQueue('unknown');

      window.removeEventListener('mq-message-flow', listener);
      expect(listener).not.toHaveBeenCalled();
      expect(useStore.getState().localDepths).toEqual({});
    });
  });

  describe('setNodeDepth', () => {
    it('sets both the API depth and the local depth', () => {
      useStore.getState().setNodeDepth(QUEUE_ID, 7);

      const state = useStore.getState();
      expect(state.nodeDepths[QUEUE_ID]).toBe(7);
      expect(state.localDepths[QUEUE_ID]).toBe(7);
    });

    it('keeps the depths of other queues', () => {
      useStore.getState().setNodeDepth('a', 1);
      useStore.getState().setNodeDepth('b', 2);

      expect(useStore.getState().nodeDepths).toEqual({ a: 1, b: 2 });
    });
  });

  describe('updateQueueData', () => {
    it('replaces the stored queue data', () => {
      const data = [{ name: 'DEV.QUEUE.1', depth: 2 }];

      useStore.getState().updateQueueData(data);

      expect(useStore.getState().queueData).toEqual(data);
    });
  });

  describe('addNode', () => {
    it('appends the node to the existing ones', () => {
      useStore.getState().addNode(makeProducer('10'));

      const ids = useStore.getState().nodes.map((node) => node.id);
      expect(ids).toEqual(['1', '2', '3', '10']);
    });
  });

  describe('getQueuesNodes', () => {
    it('returns only the queue nodes', () => {
      useStore.getState().addNode(makeProducer('10'));
      useStore.getState().addNode(makeQueue('11', 'DEV.QUEUE.2'));

      const queues = useStore.getState().getQueuesNodes();

      expect(queues.map((node) => node.id)).toEqual(['3', '11']);
    });
  });

  describe('onDeleteEdge', () => {
    it('removes the edge', () => {
      useStore.getState().onDeleteEdge('1-3');

      const ids = useStore.getState().edges.map((edge) => edge.id);
      expect(ids).toEqual(['3-2']);
    });

    it('resets the connected queue and active flag of the producer', () => {
      useStore.getState().onDeleteEdge('1-3');

      expect(getNode(PRODUCER_ID)?.data).toMatchObject({
        connectedQueue: '',
        isActive: false,
      });
    });

    it('leaves the queue node itself untouched', () => {
      useStore.getState().onDeleteEdge('1-3');

      expect(getNode(QUEUE_ID)?.data).toMatchObject({
        queueName: 'DEV.QUEUE.1',
      });
      expect(getNode(QUEUE_ID)?.data).not.toHaveProperty('connectedQueue');
    });
  });

  describe('onDeleteNode', () => {
    it('removes a producer node but keeps the edges', () => {
      useStore.getState().onDeleteNode(PRODUCER_ID);

      expect(getNode(PRODUCER_ID)).toBeUndefined();
      expect(useStore.getState().edges).toHaveLength(2);
    });

    it('removes a queue together with all of its edges', () => {
      useStore.getState().onDeleteNode(QUEUE_ID, true);

      expect(getNode(QUEUE_ID)).toBeUndefined();
      expect(useStore.getState().edges).toEqual([]);
    });

    it('disconnects the producer and consumer of a deleted queue', () => {
      useStore.getState().onDeleteNode(QUEUE_ID, true);

      expect(getNode(PRODUCER_ID)?.data).toMatchObject({ connectedQueue: '' });
      expect(getNode(CONSUMER_ID)?.data).toMatchObject({ connectedQueue: '' });
    });

    it('only removes edges of the deleted queue', () => {
      useStore.getState().addNode(makeQueue('11', 'DEV.QUEUE.2'));
      useStore.getState().addNode(makeProducer('12'));
      useStore.getState().onConnect({
        source: '12',
        target: '11',
        sourceHandle: null,
        targetHandle: null,
      });

      useStore.getState().onDeleteNode(QUEUE_ID, true);

      const ids = useStore.getState().edges.map((edge) => edge.id);
      expect(ids).toEqual(['12-11']);
    });
  });

  describe('onConnect', () => {
    it('connects a producer to a queue and records the queue name', () => {
      useStore.getState().addNode(makeQueue('11', 'DEV.QUEUE.2'));
      useStore.getState().addNode(makeProducer('12'));

      useStore.getState().onConnect({
        source: '12',
        target: '11',
        sourceHandle: null,
        targetHandle: null,
      });

      const edge = useStore.getState().edges.find((e) => e.id === '12-11');
      expect(edge).toMatchObject({
        source: '12',
        target: '11',
        type: 'custom',
        animated: false,
      });
      expect(getNode('12')?.data).toMatchObject({
        connectedQueue: 'DEV.QUEUE.2',
      });
    });

    it('does not alert on a valid connection', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      useStore.getState().addNode(makeProducer('12'));

      useStore.getState().onConnect({
        source: '12',
        target: QUEUE_ID,
        sourceHandle: null,
        targetHandle: null,
      });

      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('alerts and adds no edge when connecting producer to consumer', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      useStore.getState().onConnect({
        source: PRODUCER_ID,
        target: CONSUMER_ID,
        sourceHandle: null,
        targetHandle: null,
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Impossible setting the connection between these two components'
      );
      expect(useStore.getState().edges).toHaveLength(2);
    });

    it('alerts when connecting two queues', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      useStore.getState().addNode(makeQueue('11', 'DEV.QUEUE.2'));

      useStore.getState().onConnect({
        source: QUEUE_ID,
        target: '11',
        sourceHandle: null,
        targetHandle: null,
      });

      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(useStore.getState().edges).toHaveLength(2);
    });
  });

  describe('onClick', () => {
    it('activates the node and animates its edges', () => {
      useStore.getState().onClick(PRODUCER_ID);

      expect(getNode(PRODUCER_ID)?.data.isActive).toBe(true);
      const edges = useStore.getState().edges;
      expect(edges.find((e) => e.id === '1-3')?.animated).toBe(true);
      expect(edges.find((e) => e.id === '3-2')?.animated).toBe(false);
    });

    it('deactivates the node on a second click', () => {
      useStore.getState().onClick(PRODUCER_ID);
      useStore.getState().onClick(PRODUCER_ID);

      expect(getNode(PRODUCER_ID)?.data.isActive).toBe(false);
      expect(useStore.getState().edges.every((e) => !e.animated)).toBe(true);
    });
  });

  describe('changeEdgeAnimationFromNodeId', () => {
    it('animates only the edges leaving the node', () => {
      useStore.getState().changeEdgeAnimationFromNodeId(PRODUCER_ID, true);

      const edges = useStore.getState().edges;
      expect(edges.find((e) => e.id === '1-3')?.animated).toBe(true);
      expect(edges.find((e) => e.id === '3-2')?.animated).toBe(false);
    });

    it('can stop the animation again', () => {
      useStore.getState().changeEdgeAnimationFromNodeId(PRODUCER_ID, true);
      useStore.getState().changeEdgeAnimationFromNodeId(PRODUCER_ID, false);

      expect(useStore.getState().edges.every((e) => !e.animated)).toBe(true);
    });

    it('targets a single edge by id when called from an edge', () => {
      useStore.getState().changeEdgeAnimationFromNodeId('3-2', true, true);

      const edges = useStore.getState().edges;
      expect(edges.find((e) => e.id === '3-2')?.animated).toBe(true);
      expect(edges.find((e) => e.id === '1-3')?.animated).toBe(false);
    });
  });

  describe('onReconnect', () => {
    it('moves a producer edge to another queue', () => {
      useStore.getState().addNode(makeQueue('11', 'DEV.QUEUE.2'));
      const oldEdge = useStore.getState().edges.find((e) => e.id === '1-3')!;

      useStore.getState().onReconnect(oldEdge, {
        source: PRODUCER_ID,
        target: '11',
        sourceHandle: null,
        targetHandle: null,
      });

      const edges = useStore.getState().edges;
      expect(edges.some((e) => e.target === '11')).toBe(true);
      expect(edges.some((e) => e.id === '1-3')).toBe(false);
      expect(getNode(PRODUCER_ID)?.data).toMatchObject({
        connectedQueue: 'DEV.QUEUE.2',
      });
    });
  });

  describe('onNodesChange / onEdgesChange', () => {
    it('applies a position change to the node', () => {
      useStore.getState().onNodesChange([
        {
          id: PRODUCER_ID,
          type: 'position',
          position: { x: 10, y: 20 },
        },
      ]);

      expect(getNode(PRODUCER_ID)?.position).toEqual({ x: 10, y: 20 });
    });

    it('applies a remove change to the edge', () => {
      useStore.getState().onEdgesChange([{ id: '1-3', type: 'remove' }]);

      const ids = useStore.getState().edges.map((edge) => edge.id);
      expect(ids).toEqual(['3-2']);
    });
  });
});
