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
  emitMessageFlow,
  isQueueNode,
  patchNodeData,
} from '../../Map/utils';
import type { PubSubStoreState } from '../../../types';

const utils = new MapUtils();

const useStore = create<PubSubStoreState>()((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  dataframe: [],

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
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

    // change subscription
    if (setConnection) {
      utils.drawConnectionNodeToQueueFromConnection(set, get, connection);
    } else {
      alert('Impossible setting the connection between these two components');
    }
  },

  onClick: (nodeId) => {
    utils.setActiveNodeAndAnimateFromNodeId(set, get, nodeId);
  },

  changeEdgeAnimationFromNodeId: (nodeId, _state, _isFromEdge) => {
    // PubSub toggles animation unconditionally; _state and _isFromEdge are
    // unused here but required by the BaseStoreState interface.
    utils.animateEdgeFromNodeIds(set, get, nodeId);
  },

  publisherSent: (publisherNodeId) => {
    get().edges.forEach((edge) => {
      if (edge.source === publisherNodeId) emitMessageFlow(edge.id);
    });
  },

  subscriberReceived: (subscriberNodeId) => {
    get().edges.forEach((edge) => {
      if (edge.target === subscriberNodeId) emitMessageFlow(edge.id);
    });
  },

  onDeleteEdge: (edgeId) => {
    utils.updateQueueOnDeletingEdge(set, get, edgeId, true);
    set({
      edges: get().edges.filter((edge) => edge.id !== edgeId),
    });
  },

  onDeleteNode: (nodeId, isAQueue = false) => {
    if (isAQueue) {
      // if we are deleting a queue we have to update the connections
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

  getQueuesNodes: () => {
    return get().nodes.filter((node) => node.type === 'queue');
  },

  updateTopicName: (id, inputText) => {
    // delete edges
    const edgesToDelete = utils.getEdgesFromNode(set, get, id);
    edgesToDelete.forEach((edge) => {
      get().onDeleteEdge(edge.id);
    });
    set({
      nodes: patchNodeData(get().nodes, id, { queueName: inputText }),
    });
  },

  setDataframeForChart: () => {
    // Each group is a specific topic
    const { nodes } = get();
    return nodes.filter(isQueueNode).map(({ data }) => ({
      group: data.queueName,
      value: nodes.filter(
        (node) =>
          node.data.role === 'Consumer' &&
          node.data.connectedQueue === data.queueName
      ).length,
    }));
  },

  deleteEdgeFromNode: (nodeId) => {
    // Get the edges connected to the node and delete them all
    utils.getEdgesFromNode(set, get, nodeId).forEach((edge) => {
      get().onDeleteEdge(edge.id);
    });
  },

  getAvailableTopic: () => {
    return get()
      .nodes.filter(isQueueNode)
      .map((node) => ({ id: node.id, text: node.data.queueName }));
  },
}));

export default useStore;
