/**
 * Copyright 2022, 2026 IBM Corp.
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

import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  reconnectEdge,
} from '@xyflow/react';
import initialNodes from './nodes';
import initialEdges from './edges';
import MapUtils, {
  bumpQueueCounter,
  emitMessageFlow,
  getQueueDepth,
  isQueueNode,
} from '../../Map/utils';
import type { MQFlowNode, P2PStoreState } from '../../../types';

const utils = new MapUtils();

const useStore = create<P2PStoreState>()((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  queueData: [],
  nodeDepths: {},
  localDepths: {},
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as MQFlowNode[], // cast: applyNodeChanges returns Node[]; our nodes are MQFlowNode[] and are unchanged by the utility
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onReconnect: (oldEdge, connection) => {
    utils.updateConnectionNodeToQueue(set, get, connection);
    set({
      edges: reconnectEdge(oldEdge, connection, get().edges),
    });
    utils.disabledNonConnetedQueue(set, get, oldEdge, connection);
  },

  onConnect: (connection) => {
    const setConnection = utils.updateConnectionNodeToQueue(
      set,
      get,
      connection
    );

    if (setConnection) {
      utils.drawConnectionNodeToQueueFromConnection(set, get, connection);
    } else {
      alert('Impossible setting the connection between these two components');
    }
  },

  onClick: (nodeId) => {
    utils.setActiveNodeAndAnimateFromNodeId(set, get, nodeId);
  },

  changeEdgeAnimationFromNodeId: (nodeId, state, isFromEdge = false) => {
    utils.animateEdgeFromProducer(set, get, nodeId, state, isFromEdge);
  },

  sendMessages: (nodeId, count) => {
    const outEdge = get().edges.find((e) => e.source === nodeId);
    if (!outEdge) return;
    const queueNodeId = outEdge.target;
    set((state) => ({
      localDepths: {
        ...state.localDepths,
        [queueNodeId]: getQueueDepth(state, queueNodeId) + count,
      },
    }));
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        emitMessageFlow(outEdge.id);
        setTimeout(() => {
          set({
            nodes: bumpQueueCounter(get().nodes, queueNodeId, 'landCount'),
          });
        }, 950);
      }, i * 1000);
    }
  },
  consumeMessageFromQueue: (consumerNodeId) => {
    const inboundEdge = get().edges.find((e) => e.target === consumerNodeId);
    if (!inboundEdge) return;
    const queueNodeId = inboundEdge.source;
    emitMessageFlow(inboundEdge.id);
    const queueNode = get().nodes.find((n) => n.id === queueNodeId);
    const nodeLandCount = isQueueNode(queueNode)
      ? (queueNode.data.landCount ?? 0)
      : 0;
    const prevLocal = getQueueDepth(get(), queueNodeId, nodeLandCount);
    const newLocal = Math.max(prevLocal - 1, 0);
    set((state) => ({
      localDepths: { ...state.localDepths, [queueNodeId]: newLocal },
    }));
  },

  onDeleteEdge: (edgeId) => {
    utils.updateQueueOnDeletingEdge(set, get, edgeId);
    set({
      edges: get().edges.filter((edge) => edge.id !== edgeId),
    });
  },

  onDeleteNode: (nodeId, isAQueue = false) => {
    if (isAQueue) {
      const edges = get().edges.filter(
        (edge) => edge.target === nodeId || edge.source === nodeId
      );
      edges.forEach((e) => {
        get().onDeleteEdge(e.id);
      });
    }
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
    });
  },

  addNode: (node) => {
    set({
      nodes: get().nodes.concat(node),
    });
  },

  setNodeDepth: (nodeId, depth) => {
    set((state) => ({
      nodeDepths: { ...state.nodeDepths, [nodeId]: depth },
      localDepths: { ...state.localDepths, [nodeId]: depth },
    }));
  },

  updateQueueData: (data) => {
    set({ queueData: data });
  },

  getQueuesNodes: () => {
    return get().nodes.filter((node) => node.type === 'queue');
  },
}));

export default useStore;
