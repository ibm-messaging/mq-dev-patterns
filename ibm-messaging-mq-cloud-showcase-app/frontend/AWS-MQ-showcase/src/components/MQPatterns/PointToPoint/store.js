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
import MapUtils, { emitMessageFlow } from '../../Map/utils';
//import { persist } from 'zustand/middleware';
const utils = new MapUtils();

const useStore = create((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  queueData: [],
  nodeDepths: {},
  localDepths: {},
  onNodesChange: changes => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: changes => {
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
  onConnect: connection => {
    var setConnection = utils.updateConnectionNodeToQueue(set, get, connection);

    if (setConnection) {
      utils.drawConnectionNodeToQueueFromConnection(set, get, connection);
    } else {
      alert('Impossible setting the connection between these two components');
    }
  },
  onClick: nodeId => {
    utils.setActiveNodeAndAnimateFromNodeId(set, get, nodeId);
  },
  changeEdgeAnimationFromNodeId: (nodeId, state, isFromEdge = false) => {
    utils.animateEdgeFromProducer(set, get, nodeId, state, isFromEdge);
  },
  sendMessages: (nodeId, count) => {
    const edges = get().edges;
    const outEdge = edges.find(e => e.source === nodeId);
    if (!outEdge) return;
    // Find the target queue node id from the edge
    const queueNodeId = outEdge.target;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        emitMessageFlow(outEdge.id);
        setTimeout(() => {
          set({
            nodes: get().nodes.map(node => {
              if (node.id === queueNodeId) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    landCount: (node.data?.landCount || 0) + 1,
                  },
                };
              }
              return node;
            }),
          });
        }, 950);
      }, i * 1000);
    }
  },

  consumeMessageFromQueue: consumerNodeId => {
    const MAX_SLOTS = 5;
    const edges = get().edges;
    const inboundEdge = edges.find(e => e.target === consumerNodeId);
    if (!inboundEdge) return;
    const queueNodeId = inboundEdge.source;
    emitMessageFlow(inboundEdge.id);
    const prevLocal =
      get().localDepths[queueNodeId] ?? get().nodeDepths[queueNodeId] ?? 0;
    const newLocal = Math.max(prevLocal - 1, 0);
    set(state => ({
      localDepths: { ...state.localDepths, [queueNodeId]: newLocal },
      nodes: state.nodes.map(node => {
        if (node.id === queueNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              drainCount:
                prevLocal <= MAX_SLOTS
                  ? (node.data?.drainCount || 0) + 1
                  : node.data?.drainCount || 0,
            },
          };
        }
        return node;
      }),
    }));
  },
  onDeleteEdge: edgeId => {
    utils.updateQueueOnDeletingEdge(set, get, edgeId);
    set({
      edges: get().edges.filter(edge => edge.id !== edgeId),
    });
  },
  onDeleteNode: (nodeId, isAQueue = false) => {
    if (isAQueue) {
      // if we are deleting a queue we have to update the connections
      let edges = get().edges.filter(
        edge => edge.target === nodeId || edge.source === nodeId
      );
      edges.forEach(e => {
        get().onDeleteEdge(e.id);
      });
    }
    set({
      nodes: get().nodes.filter(node => node.id !== nodeId),
    });
  },
  addNode: node => {
    set({
      nodes: get().nodes.concat(node),
    });
  },
  setNodeDepth: (nodeId, depth) => {
    set(state => ({
      nodeDepths: { ...state.nodeDepths, [nodeId]: depth },
      localDepths: { ...state.localDepths, [nodeId]: depth },
    }));
  },
  updateQueueData: data => {
    set(state => ({
      queueData: data,
    }));
  },
  getQueuesNodes: () => {
    return get().nodes.filter(node => node.type === 'queue');
  },
}));

export default useStore;
