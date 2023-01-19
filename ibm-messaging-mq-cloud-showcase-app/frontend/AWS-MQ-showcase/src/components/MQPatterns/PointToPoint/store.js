/**
 * Copyright 2022, 2023 IBM Corp.
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

import create from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  updateEdge,
} from 'react-flow-renderer';
import initialNodes from './nodes';
import initialEdges from './edges';
import MapUtils from '../../Map/utils';
//import { persist } from 'zustand/middleware';
const utils = new MapUtils();

const useStore = create((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  queueData: [],
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
  onEdgeUpdate: (oldEdge, connection) => {
    utils.updateConnectionNodeToQueue(set, get, connection);
    set({
      edges: updateEdge(oldEdge, connection, get().edges),
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
