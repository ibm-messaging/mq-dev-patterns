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
import MapUtils, { emitMessageFlow } from '../../Map/utils';
import Cookies from 'js-cookie';
//import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
const utils = new MapUtils();

let sessionID = Cookies.get('sessionID');
let requestorSessionID = Cookies.get('requestorSessionID');

const setCookies = () => {
  if (!sessionID) {
    sessionID = uuidv4().replace(/-/g, '');
    requestorSessionID = uuidv4().replace(/-/g, '');
    Cookies.set('sessionID', sessionID);
    Cookies.set('requestorSessionID', requestorSessionID);
  }
};

setCookies();

const _initialNodes = [
  {
    id: requestorSessionID,
    type: 'producer',
    data: {
      role: 'Producer',
      label: 'Participants checker',
      connectedQueue: 'DEV.QUEUE.3',
      isActive: false,
    },
    position: { x: 200, y: 62 },
    sourcePosition: 'right',
    targetPosition: 'right',
    draggable: true,
  },
  {
    id: sessionID,
    type: 'consumer',
    data: {
      role: 'Consumer',
      label: 'Participant confirmation',
      connectedQueue: 'DEV.QUEUE.3',
      isActive: false,
    },
    position: { x: 1150, y: 50 },
    targetPosition: 'left',
    sourcePosition: 'left',
    draggable: true,
  },
  {
    id: '17',
    type: 'queue',
    isAqueue: 1,
    data: {
      role: 'q',
      depth: 0,
      queueName: 'DEV.QUEUE.3',
    },
    position: { x: 650, y: 20 },
    sourcePosition: 'right',
    targetPosition: 'left',
    draggable: true,
  },
];

const useStore = create((set, get) => ({
  nodes: _initialNodes,
  nodeDepths: {},
  edges: [
    {
      id: '17-' + sessionID,
      source: '17',
      target: sessionID,
      type: 'custom',
      animated: false,
      style: { stroke: '#0050e6', strokeWidth: 1 },
    },
    {
      id: requestorSessionID + '-17',
      source: requestorSessionID,
      target: '17',
      type: 'custom',
      animated: false,
      style: { stroke: '#0050e6', strokeWidth: 1 },
    },
  ],
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
  changeEdgeAnimationFromNodeId: (nodeId, state) => {
    utils.animateEdgeFromProducer(set, get, nodeId, state);
  },
  sendMessages: (nodeId, count) => {
    const edges = get().edges;
    const outEdge = edges.find(e => e.source === nodeId);
    if (!outEdge) return;
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
  drainMessageFromQueue: responderNodeId => {
    const edges = get().edges;
    const inboundEdge = edges.find(e => e.target === responderNodeId);
    if (!inboundEdge) return;
    const queueNodeId = inboundEdge.source;
    set({
      nodes: get().nodes.map(node => {
        if (node.id === queueNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              drainCount: (node.data?.drainCount || 0) + 1,
            },
          };
        }
        return node;
      }),
    });
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
  creteTmpQueue: (tmpQueueName, requestNodeId) => {
    let tmpQueue = {
      id: '10',
      type: 'queue',
      isAqueue: 1,
      data: {
        role: 'q',
        depth: 0,
        queueName: tmpQueueName,
        isReplyQueue: true,
      },
      position: { x: 650, y: 370 },
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
    const replyQueueNode = get().nodes.find(
      node => node.data.role === 'q' && node.data.queueName === tmpQueueName
    );
    if (!replyQueueNode) return;
    const replyQueueNodeId = replyQueueNode.id;

    const edge = get().edges.find(
      e => e.source === responderId && e.target === replyQueueNodeId
    );
    if (edge) {
      emitMessageFlow(edge.id);
      setTimeout(() => {
        set({
          nodes: get().nodes.map(node => {
            if (node.id === replyQueueNodeId) {
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
    }

    utils.animateEdgeFromConnection(set, get, responderId, replyQueueNodeId);
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
