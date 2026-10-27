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
  Position,
} from '@xyflow/react';
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';
import MapUtils, {
  bumpQueueCounter,
  emitMessageFlow,
  EDGE_STYLE_THIN,
  getQueueDepth,
  isQueueNode,
} from '../../Map/utils';
import type { MQFlowEdge, MQFlowNode, RRStoreState } from '../../../types';

const utils = new MapUtils();

// ── Session IDs (stable for the browser session via cookies) ─────────────────

let sessionID = Cookies.get('sessionID');
let requestorSessionID = Cookies.get('requestorSessionID');

if (!sessionID) {
  sessionID = uuidv4().replace(/-/g, '');
  requestorSessionID = uuidv4().replace(/-/g, '');
  Cookies.set('sessionID', sessionID);
  Cookies.set('requestorSessionID', requestorSessionID);
}

// Both are guaranteed non-empty after the block above; throw to make it explicit.
if (!sessionID || !requestorSessionID) {
  throw new Error('Failed to initialise session cookies');
}

// ── Initial graph ─────────────────────────────────────────────────────────────

const initialNodes: MQFlowNode[] = [
  {
    id: requestorSessionID,
    type: 'producer',
    data: {
      role: 'Producer',
      label: 'Participants checker',
      connectedQueue: 'DEV.QUEUE.3',
      isActive: false,
    },
    position: { x: 100, y: 200 },
    sourcePosition: Position.Right,
    targetPosition: Position.Right,
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
    position: { x: 1150, y: 200 },
    targetPosition: Position.Left,
    sourcePosition: Position.Left,
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
    position: { x: 650, y: 165 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: true,
  },
];

const initialEdges: MQFlowEdge[] = [
  {
    id: '17-' + sessionID,
    source: '17',
    target: sessionID,
    type: 'custom',
    animated: false,
    style: EDGE_STYLE_THIN,
  },
  {
    id: requestorSessionID + '-17',
    source: requestorSessionID,
    target: '17',
    type: 'custom',
    animated: false,
    style: EDGE_STYLE_THIN,
  },
];

// ── Store ─────────────────────────────────────────────────────────────────────

const useStore = create<RRStoreState>()((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  queueData: [],
  nodeDepths: {},
  localDepths: {},

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

  drainMessageFromQueue: (responderNodeId) => {
    const inboundEdge = get().edges.find((e) => e.target === responderNodeId);
    if (!inboundEdge) return;
    const queueNodeId = inboundEdge.source;
    const queueNode = get().nodes.find((n) => n.id === queueNodeId);
    const nodeLandCount = isQueueNode(queueNode)
      ? (queueNode.data.landCount ?? 0)
      : 0;
    const prevLocal = getQueueDepth(get(), queueNodeId, nodeLandCount);
    const newLocal = Math.max(prevLocal - 1, 0);
    set((state) => ({
      localDepths: { ...state.localDepths, [queueNodeId]: newLocal },
      nodes: bumpQueueCounter(state.nodes, queueNodeId, 'drainCount'),
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

  creteTmpQueue: (tmpQueueName, requestNodeId) => {
    const tmpQueue: MQFlowNode = {
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
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      draggable: true,
    };

    get().addNode(tmpQueue);
    utils.drawConnectionNodeToQueueFromConnection(set, get, {
      target: requestNodeId,
      source: tmpQueue.id,
    });
  },

  drawTmpConnection: (tmpQueueName, responderId, isResp) => {
    const node = get().nodes.find(
      (n) => n.data.role === 'q' && n.data.queueName === tmpQueueName
    );
    if (!node) return;
    const connection = isResp
      ? { source: responderId, target: node.id }
      : { target: node.id, source: responderId };

    utils.drawConnectionNodeToQueueFromConnection(set, get, connection);
  },

  animateTmpConnection: (tmpQueueName, responderId) => {
    const replyQueueNode = get().nodes.find(
      (n) => n.data.role === 'q' && n.data.queueName === tmpQueueName
    );
    if (!replyQueueNode) return;
    const replyQueueNodeId = replyQueueNode.id;

    const edge = get().edges.find(
      (e) => e.source === responderId && e.target === replyQueueNodeId
    );
    if (edge) {
      emitMessageFlow(edge.id);
      setTimeout(() => {
        set({
          nodes: bumpQueueCounter(get().nodes, replyQueueNodeId, 'landCount'),
        });
      }, 950);
    }

    utils.animateEdgeFromConnection(set, get, responderId, replyQueueNodeId);
  },

  deleteEdgeFromConnection: (tmpQueueName, responderId) => {
    const node = get().nodes.find(
      (n) => n.data.role === 'q' && n.data.queueName === tmpQueueName
    );
    if (!node) return;
    const edgeId = `${responderId}-${node.id}`;
    get().onDeleteEdge(edgeId);
  },

  deleteTmpQueueFromTmpQueueName: (tmpQueueName) => {
    const tmpQueueNode = get().nodes.find(
      (node) => node.data.queueName === tmpQueueName
    );
    if (!tmpQueueNode) return;
    set({
      nodes: get().nodes.filter((node) => node.id !== tmpQueueNode.id),
    });
  },
}));

export default useStore;
