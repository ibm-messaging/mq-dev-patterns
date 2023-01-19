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
  changeEdgeAnimationFromNodeId: (nodeId, state) => {
    utils.animateEdgeFromProducer(set, get, nodeId, state);
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
  creteTmpQueue: (tmpQueueName, requestNodeId) => {
    let tmpQueue = {
      id: '10',
      type: 'queue',
      isAqueue: 1,
      data: {
        role: 'q',
        depth: 0,
        queueName: tmpQueueName,
      },
      position: { x: 650, y: 170 },
      sourcePosition: 'right',
      targetPosition: 'left',
      draggable: true,
    };

    get().addNode(tmpQueue);
    let connection = {
      target: requestNodeId,
      source: tmpQueue.id,
    };
    utils.drawConnectionNodeToQueueFromConnection(set, get, connection);
  },
  drawTmpConnection: (tmpQueueName, responderId, isResp) => {
    let node = get().nodes.filter(
      node => node.data.role === 'q' && node.data.queueName === tmpQueueName
    );
    let connection = {};
    if (isResp) {
      connection = {
        source: responderId,
        target: node[0].id,
      };
    } else {
      connection = {
        target: node[0].id,
        source: responderId,
      };
    }

    utils.drawConnectionNodeToQueueFromConnection(set, get, connection);
  },

  animateTmpConnection: (tmpQueueName, responderId) => {
    let node = get().nodes.filter(
      node => node.data.role === 'q' && node.data.queueName === tmpQueueName
    );
    let connection = {
      source: node[0].id,
      target: responderId,
    };

    utils.animateEdgeFromConnection(
      set,
      get,
      connection.source,
      connection.target
    );
  },
  deleteEdgeFromConnection: (tmpQueueName, responderId) => {
    let node = get().nodes.filter(
      node => node.data.role === 'q' && node.data.queueName === tmpQueueName
    );
    let connection = {
      source: responderId,
      target: node[0].id,
    };
    let edgeId = connection.source + '-' + connection.target;
    get().onDeleteEdge(edgeId);
  },
  deleteTmpQueueFromTmpQueueName: tmpQueueName => {
    let tmpQueueNodeId = get().nodes.filter(
      node => node.data.queueName === tmpQueueName
    );
    set({
      nodes: get().nodes.filter(node => node.id !== tmpQueueNodeId[0].id),
    });
  },
}));

export default useStore;
