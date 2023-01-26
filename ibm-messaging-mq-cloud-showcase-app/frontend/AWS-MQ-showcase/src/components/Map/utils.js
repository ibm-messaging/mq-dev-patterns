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


import { addEdge } from 'react-flow-renderer';

class MapUtils {
  updateConnectionNodeToQueue(
    set,
    get,
    connection,
    isSub = false,
    isToUpdateSub = false
  ) {
    let srcId = connection['source'];
    let trgtId = connection['target'];
    let trgtNode = get().nodes.find(e => e.id === trgtId);
    let srcNode = get().nodes.find(e => e.id === srcId);
    let trgtIsAQueue = trgtNode.data.role === 'q';
    let srcIsAQueue = srcNode.data.role === 'q';

    let setConnection = false;
    let queueName = '';

    if (trgtIsAQueue && !srcIsAQueue) {
      queueName = trgtNode.data.queueName;
      if (queueName) {
        set({
          nodes: get().nodes.map(node => {
            if (node.id === srcId) {
              node = {
                ...node,
                data: {
                  ...node.data,
                  connectedQueue: queueName,
                  subscriptionState: isSub ? true : 0,
                },
              };
            }
            return node;
          }),
        });
        setConnection = true;
      }
    } else if (srcIsAQueue && !trgtIsAQueue) {
      queueName = srcNode.data.queueName;
      if (queueName) {
        set({
          nodes: get().nodes.map(node => {
            if (node.id === trgtId) {
              node = {
                ...node,
                data: {
                  ...node.data,
                  connectedQueue: queueName,
                  subscriptionState: isSub ? true : 0,
                },
              };
            }
            return node;
          }),
        });
        setConnection = true;
      }
    }
    return setConnection;
  }

  disabledNonConnetedQueue(set, get, oldEdge, connection) {
    let nodeIdChanged =
      oldEdge.source === connection.source ? oldEdge.target : oldEdge.source;
    let nodeIdConnected =
      oldEdge.source === connection.source
        ? connection.target
        : connection.source;

    let isActiveNode = false;
    let isToAQueue = false;

    set({
      nodes: get().nodes.map(node => {
        if (node.id === nodeIdChanged) {
          node = {
            ...node,
            data: {
              ...node.data,
              isActive: false,
              connectedQueue: '',
            },
          };
        }
        if (node.id === nodeIdConnected && node.type === 'queue') {
          isToAQueue = true;
        } else if (node.id === nodeIdConnected && node.type !== 'queue') {
          isActiveNode = node.data.isActive;
        }
        return node;
      }),
    });

    if (!isToAQueue) {
      set({
        edges: get().edges.map(edge => {
          if (
            edge.source === nodeIdConnected ||
            edge.target === nodeIdConnected
          ) {
            edge = {
              ...edge,
              animated: isActiveNode,
              style: {
                stroke: isActiveNode ? '#0050e6' : '#0050e6',
                strokeWidth: 1.5,
              },
            };
          }
          return edge;
        }),
      });
    }
  }

  // Active nodes are either the consumer or the producer
  refreshEdgeStateOnConnection(set, get, activeNode) {}

  animateEdgeFromNodeIds(set, get, nodeId) {
    set({
      edges: get().edges.map(edge => {
        if (edge.source === nodeId || edge.target === nodeId) {
          edge = {
            ...edge,
            animated: !edge.animated,
            style: {
              stroke: '#0050e6',
              strokeWidth: 1.5,
            },
          };
        }
        return edge;
      }),
    });
  }

  animateEdgeFromProducer(set, get, nodeId, state, isFromEdge = false) {
    set({
      edges: get().edges.map(edge => {
        if (edge.source === nodeId || (isFromEdge && edge.id === nodeId)) {
          edge = {
            ...edge,
            animated: state,
            style: {
              stroke: '#0050e6',
              strokeWidth: 1.5,
            },
          };
        }
        return edge;
      }),
    });
  }

  animateEdgeFromConnection(set, get, source, target) {
    set({
      edges: get().edges.map(edge => {
        if (
          (edge.source === source && edge.target === target) ||
          (edge.target === source && edge.source === target)
        ) {
          edge = {
            ...edge,
            animated: true,
            style: {
              stroke: '#0050e6',
              strokeWidth: 1.5,
            },
          };
        }
        return edge;
      }),
    });
  }

  setActiveNodeAndAnimateFromNodeId(set, get, nodeId) {
    set({
      nodes: get().nodes.map(node => {
        if (node.id === nodeId) {
          node = {
            ...node,
            data: {
              ...node.data,
              isActive: !node.data.isActive,
            },
          };
        }
        return node;
      }),
    });
    this.animateEdgeFromNodeIds(set, get, nodeId);
  }

  drawConnectionNodeToQueueFromConnection(set, get, connection) {
    let e = {
      id: connection['source'] + '-' + connection['target'],
      source: connection['source'],
      target: connection['target'],
      animated: false,
      style: {
        stroke: '#0050e6',
        strokeWidth: 1,
      },
      type: 'custom',
    };
    set({
      edges: addEdge(e, get().edges),
    });
  }

  updateQueueOnDeletingEdge(set, get, edgeId, isSub = false) {
    let split = edgeId.split('-');    
    let srcId = split[0];
    let targetId = split[1];

    set({
      nodes: get().nodes.map(node => {
        if (
          (node.id === srcId || node.id === targetId) &&
          (node.type === 'producer' || node.type === 'consumer')
        ) {
          node = {
            ...node,
            data: {
              ...node.data,
              connectedQueue: '',
              isActive: false,
              subscriptionState: isSub ? 2 : undefined,
            },
          };
        }
        return node;
      }),
    });
  }

  getEdgesFromNode(set, get, nodeId) {
    let edges = get().edges.filter(
      edge => edge.source === nodeId || edge.target === nodeId
    );

    return edges;
  }
}

export default MapUtils;
