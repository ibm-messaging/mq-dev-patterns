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

// Tests the publish-subscribe store (PubSub/store.ts). It checks the nodes and
// edges and the actions that change them. It checks that a message is played
// along the right edges. It checks the subscriber count of each topic. It checks
// connecting, reconnecting, renaming and deleting nodes and edges.

import { Position } from '@xyflow/react';
import useStore from './store';
import type { MQFlowNode } from '../../../types';

const CLASSIC_PUBLISHER = '1';
const CLASSIC_TOPIC = '2';
const CLASSIC_SUB = '3';
const VIP_TOPIC = '7';
const WILDCARD_TOPIC = '8';

const getNode = (id: string) =>
  useStore.getState().nodes.find((node) => node.id === id);

const getEdge = (id: string) =>
  useStore.getState().edges.find((edge) => edge.id === id);

const makePublisher = (id: string): MQFlowNode => ({
  id,
  type: 'producer',
  data: {
    role: 'Producer',
    label: 'Publisher',
    connectedQueue: '',
    isActive: false,
  },
  position: { x: 0, y: 0 },
  sourcePosition: Position.Right,
});

const makeSubscriber = (id: string): MQFlowNode => ({
  id,
  type: 'consumer',
  data: {
    role: 'Consumer',
    label: 'Subscriber',
    connectedQueue: '',
    subscriptionState: 0,
  },
  position: { x: 0, y: 0 },
  targetPosition: Position.Left,
});

const makeTopic = (id: string, queueName: string): MQFlowNode => ({
  id,
  type: 'queue',
  data: { role: 'q', depth: 0, queueName },
  position: { x: 0, y: 0 },
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
});

// Returns the sorted ids of the edges that get a message event while fn runs.
const flowEdges = (fn: () => void): string[] => {
  const edgeIds: string[] = [];
  const listener = (e: Event) => edgeIds.push((e as CustomEvent).detail.edgeId);
  window.addEventListener('mq-message-flow', listener);
  try {
    fn();
  } finally {
    window.removeEventListener('mq-message-flow', listener);
  }
  return edgeIds.sort();
};

describe('PubSub store', () => {
  beforeEach(() => {
    useStore.setState(useStore.getInitialState(), true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('starts with the default nine nodes and six edges', () => {
      const { nodes, edges } = useStore.getState();

      expect(nodes).toHaveLength(9);
      expect(edges).toHaveLength(6);
    });
  });

  describe('publisherSent', () => {
    it('plays a message along every edge leaving the publisher', () => {
      const edgeIds = flowEdges(() =>
        useStore.getState().publisherSent(CLASSIC_PUBLISHER)
      );

      expect(edgeIds).toEqual(['1-2']);
    });

    it('plays nothing when the publisher is not connected', () => {
      useStore.getState().addNode(makePublisher('50'));

      const edgeIds = flowEdges(() => useStore.getState().publisherSent('50'));

      expect(edgeIds).toEqual([]);
    });

    it('does not play the edges of other publishers', () => {
      const edgeIds = flowEdges(() => useStore.getState().publisherSent('6'));

      expect(edgeIds).toEqual(['6-7']);
    });
  });

  describe('subscriberReceived', () => {
    it('plays a message along the edge entering the subscriber', () => {
      const edgeIds = flowEdges(() =>
        useStore.getState().subscriberReceived(CLASSIC_SUB)
      );

      expect(edgeIds).toEqual(['2-3']);
    });

    it('plays nothing when the subscriber is not connected', () => {
      useStore.getState().addNode(makeSubscriber('50'));

      const edgeIds = flowEdges(() =>
        useStore.getState().subscriberReceived('50')
      );

      expect(edgeIds).toEqual([]);
    });
  });

  describe('addNode', () => {
    it('appends the node', () => {
      useStore.getState().addNode(makePublisher('50'));

      const { nodes } = useStore.getState();
      expect(nodes).toHaveLength(10);
      expect(nodes[9].id).toBe('50');
    });
  });

  describe('getQueuesNodes', () => {
    it('returns only the topics', () => {
      const topics = useStore.getState().getQueuesNodes();

      expect(topics.map((n) => n.id)).toEqual([
        CLASSIC_TOPIC,
        VIP_TOPIC,
        WILDCARD_TOPIC,
      ]);
    });
  });

  describe('getAvailableTopic', () => {
    // The cast is needed. getAvailableTopic is not in the store's typed interface.
    const getAvailableTopic = () =>
      (
        useStore.getState() as unknown as {
          getAvailableTopic: () => { id: string; text: string }[];
        }
      ).getAvailableTopic();

    it('lists the id and name of each topic', () => {
      expect(getAvailableTopic()).toEqual([
        { id: '2', text: 'tickets/classic' },
        { id: '7', text: 'tickets/VIP' },
        { id: '8', text: 'tickets/#' },
      ]);
    });

    it('includes topics added later', () => {
      useStore.getState().addNode(makeTopic('50', 'news'));

      expect(getAvailableTopic()).toContainEqual({
        id: '50',
        text: 'news',
      });
    });
  });

  describe('setDataframeForChart', () => {
    it('counts the subscribers of each topic', () => {
      expect(useStore.getState().setDataframeForChart()).toEqual([
        { group: 'tickets/classic', value: 2 },
        { group: 'tickets/VIP', value: 1 },
        { group: 'tickets/#', value: 1 },
      ]);
    });

    it('counts a new subscriber once it is connected', () => {
      useStore.getState().addNode(makeSubscriber('50'));
      useStore.getState().onConnect({
        source: CLASSIC_TOPIC,
        target: '50',
        sourceHandle: null,
        targetHandle: null,
      });

      expect(useStore.getState().setDataframeForChart()[0]).toEqual({
        group: 'tickets/classic',
        value: 3,
      });
    });

    // The subscribers are 2 + 1 + 1 across the three topics.
    it('does not count publishers', () => {
      const total = useStore
        .getState()
        .setDataframeForChart()
        .reduce((sum, entry) => sum + entry.value, 0);

      expect(total).toBe(4);
    });

    it('reports 0 for a topic without subscribers', () => {
      useStore.getState().addNode(makeTopic('50', 'news'));

      expect(useStore.getState().setDataframeForChart()).toContainEqual({
        group: 'news',
        value: 0,
      });
    });
  });

  describe('onConnect', () => {
    const connect = (source: string, target: string) =>
      useStore
        .getState()
        .onConnect({ source, target, sourceHandle: null, targetHandle: null });

    // window.alert is mocked. It must not be called for a valid connection.
    it('connects a publisher to a topic and adds the edge', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      useStore.getState().addNode(makePublisher('50'));

      connect('50', CLASSIC_TOPIC);

      expect(getNode('50')?.data).toMatchObject({
        connectedQueue: 'tickets/classic',
      });
      expect(getEdge('50-2')).toMatchObject({
        source: '50',
        target: '2',
        type: 'custom',
        animated: false,
      });
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('connects a topic to a subscriber and resets its subscription state', () => {
      // It starts from state 2 (unsubscribed). Connecting must set it back to 0.
      useStore.getState().addNode(makeSubscriber('50'));
      useStore.setState({
        nodes: useStore.getState().nodes.map((n): MQFlowNode =>
          n.id === '50' && n.data.role === 'Consumer'
            ? ({
                ...n,
                data: { ...n.data, subscriptionState: 2 },
              } as MQFlowNode)
            : n
        ),
      });

      connect(WILDCARD_TOPIC, '50');

      expect(getNode('50')?.data).toMatchObject({
        connectedQueue: 'tickets/#',
        subscriptionState: 0,
      });
      expect(getEdge('8-50')).toBeDefined();
    });

    it('alerts and adds no edge when connecting a publisher to a subscriber', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      useStore.getState().addNode(makePublisher('50'));
      useStore.getState().addNode(makeSubscriber('51'));

      connect('50', '51');

      expect(alertSpy).toHaveBeenCalledWith(
        'Impossible setting the connection between these two components'
      );
      expect(getEdge('50-51')).toBeUndefined();
    });

    it('alerts when connecting two topics', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      connect(CLASSIC_TOPIC, VIP_TOPIC);

      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(getEdge('2-7')).toBeUndefined();
    });

    it('alerts when the topic has no name yet', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      useStore.getState().addNode(makeTopic('50', ''));
      useStore.getState().addNode(makePublisher('51'));

      connect('51', '50');

      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(getEdge('51-50')).toBeUndefined();
    });
  });

  describe('onReconnect', () => {
    it('moves the subscriber to the new target and frees the old one', () => {
      useStore.getState().addNode(makeSubscriber('50'));
      const oldEdge = getEdge('2-3');
      expect(oldEdge).toBeDefined();

      useStore.getState().onReconnect(oldEdge!, {
        source: CLASSIC_TOPIC,
        target: '50',
        sourceHandle: null,
        targetHandle: null,
      });

      expect(getNode('50')?.data).toMatchObject({
        connectedQueue: 'tickets/classic',
      });
      expect(getNode(CLASSIC_SUB)?.data).toMatchObject({
        connectedQueue: '',
        isActive: false,
      });
      const { edges } = useStore.getState();
      expect(edges.some((e) => e.target === '50')).toBe(true);
      expect(edges.some((e) => e.target === CLASSIC_SUB)).toBe(false);
    });
  });

  describe('onClick', () => {
    it('toggles the node active and animates its edges', () => {
      useStore.getState().onClick(CLASSIC_SUB);

      expect(getNode(CLASSIC_SUB)?.data).toMatchObject({ isActive: true });
      expect(getEdge('2-3')?.animated).toBe(true);

      useStore.getState().onClick(CLASSIC_SUB);

      expect(getNode(CLASSIC_SUB)?.data).toMatchObject({ isActive: false });
      expect(getEdge('2-3')?.animated).toBe(false);
    });
  });

  describe('changeEdgeAnimationFromNodeId', () => {
    // The 2nd and 3rd arguments are ignored. The animation is always flipped.
    it('toggles the animation of the edges of the node whatever the state', () => {
      useStore
        .getState()
        .changeEdgeAnimationFromNodeId(CLASSIC_PUBLISHER, false, false);
      expect(getEdge('1-2')?.animated).toBe(true);

      useStore
        .getState()
        .changeEdgeAnimationFromNodeId(CLASSIC_PUBLISHER, true, false);
      expect(getEdge('1-2')?.animated).toBe(false);
    });

    it('leaves the edges of other nodes alone', () => {
      useStore
        .getState()
        .changeEdgeAnimationFromNodeId(CLASSIC_PUBLISHER, true, false);

      expect(getEdge('6-7')?.animated).toBe(false);
    });
  });

  describe('onDeleteEdge', () => {
    it('removes the edge', () => {
      useStore.getState().onDeleteEdge('2-3');

      expect(getEdge('2-3')).toBeUndefined();
      expect(useStore.getState().edges).toHaveLength(5);
    });

    it('disconnects the subscriber and marks the subscription as ended (2)', () => {
      useStore.getState().onDeleteEdge('2-3');

      expect(getNode(CLASSIC_SUB)?.data).toMatchObject({
        connectedQueue: '',
        isActive: false,
        subscriptionState: 2,
      });
    });

    it('disconnects the publisher', () => {
      useStore.getState().onDeleteEdge('1-2');

      expect(getNode(CLASSIC_PUBLISHER)?.data).toMatchObject({
        connectedQueue: '',
        isActive: false,
      });
    });

    it('keeps the topic and its name', () => {
      useStore.getState().onDeleteEdge('2-3');

      expect(getNode(CLASSIC_TOPIC)?.data).toMatchObject({
        queueName: 'tickets/classic',
      });
    });

    it('leaves the other subscribers of the topic subscribed', () => {
      useStore.getState().onDeleteEdge('2-3');

      expect(getNode('4')?.data).toMatchObject({
        connectedQueue: 'tickets/classic',
        subscriptionState: 0,
      });
    });
  });

  describe('onDeleteNode', () => {
    it('removes a subscriber', () => {
      useStore.getState().onDeleteNode(CLASSIC_SUB);

      expect(getNode(CLASSIC_SUB)).toBeUndefined();
      expect(useStore.getState().nodes).toHaveLength(8);
    });

    // The second argument (true) marks the node as a topic.
    it('removes a topic together with all its edges', () => {
      useStore.getState().onDeleteNode(CLASSIC_TOPIC, true);

      expect(getNode(CLASSIC_TOPIC)).toBeUndefined();
      expect(getEdge('1-2')).toBeUndefined();
      expect(getEdge('2-3')).toBeUndefined();
      expect(getEdge('2-4')).toBeUndefined();
    });

    it('disconnects everything that was attached to the removed topic', () => {
      useStore.getState().onDeleteNode(CLASSIC_TOPIC, true);

      [CLASSIC_PUBLISHER, CLASSIC_SUB, '4'].forEach((id) => {
        expect(getNode(id)?.data).toMatchObject({ connectedQueue: '' });
      });
    });

    it('does not touch other topics', () => {
      useStore.getState().onDeleteNode(CLASSIC_TOPIC, true);

      expect(getEdge('6-7')).toBeDefined();
      expect(getEdge('8-9')).toBeDefined();
    });
  });

  describe('updateTopicName', () => {
    it('renames the topic', () => {
      useStore.getState().updateTopicName(CLASSIC_TOPIC, 'tickets/new');

      expect(getNode(CLASSIC_TOPIC)?.data).toMatchObject({
        queueName: 'tickets/new',
      });
    });

    it('removes the edges of the topic so nothing stays subscribed to the old name', () => {
      useStore.getState().updateTopicName(CLASSIC_TOPIC, 'tickets/new');

      expect(getEdge('1-2')).toBeUndefined();
      expect(getEdge('2-3')).toBeUndefined();
      expect(getEdge('2-4')).toBeUndefined();
      expect(getNode(CLASSIC_SUB)?.data).toMatchObject({
        connectedQueue: '',
        subscriptionState: 2,
      });
    });

    it('leaves the other topics connected', () => {
      useStore.getState().updateTopicName(CLASSIC_TOPIC, 'tickets/new');

      expect(getEdge('6-7')).toBeDefined();
      expect(getEdge('7-5')).toBeDefined();
    });
  });

  describe('deleteEdgeFromNode', () => {
    it('removes every edge of the node', () => {
      useStore.getState().deleteEdgeFromNode(CLASSIC_TOPIC);

      expect(useStore.getState().edges.map((e) => e.id)).toEqual([
        '7-5',
        '6-7',
        '8-9',
      ]);
    });

    it('does nothing for a node without edges', () => {
      useStore.getState().addNode(makeSubscriber('50'));

      useStore.getState().deleteEdgeFromNode('50');

      expect(useStore.getState().edges).toHaveLength(6);
    });
  });

  describe('onNodesChange / onEdgesChange', () => {
    it('applies a node removal', () => {
      useStore.getState().onNodesChange([{ type: 'remove', id: '9' }]);

      expect(getNode('9')).toBeUndefined();
    });

    it('applies a node position change', () => {
      useStore.getState().onNodesChange([
        {
          type: 'position',
          id: '9',
          position: { x: 1, y: 2 },
        },
      ]);

      expect(getNode('9')?.position).toEqual({ x: 1, y: 2 });
    });

    it('applies an edge removal', () => {
      useStore.getState().onEdgesChange([{ type: 'remove', id: '8-9' }]);

      expect(getEdge('8-9')).toBeUndefined();
    });
  });
});
