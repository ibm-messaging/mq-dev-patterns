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

import { addEdge } from '@xyflow/react';
import type { Connection } from '@xyflow/react';
import type {
  MQFlowNode,
  MQFlowEdge,
  ZustandSet,
  ZustandGet,
} from '../../types';

interface StoreSlice {
  nodes: MQFlowNode[];
  edges: MQFlowEdge[];
}

export function emitMessageFlow(edgeId: string): void {
  window.dispatchEvent(
    new CustomEvent('mq-message-flow', {
      detail: {
        edgeId,
        id: Math.random().toString(36).slice(2),
      },
    })
  );
}

export function emitMessageFlowReverse(edgeId: string): void {
  window.dispatchEvent(
    new CustomEvent('mq-message-flow', {
      detail: {
        edgeId,
        id: Math.random().toString(36).slice(2),
        reverse: true,
      },
    })
  );
}

class MapUtils {
  updateConnectionNodeToQueue(
    set: ZustandSet<StoreSlice>,
    get: ZustandGet<StoreSlice>,
    connection: Connection,
    isSub = false,
    isToUpdateSub = false
  ): boolean {
    const srcId = connection['source'];
    const trgtId = connection['target'];
    const trgtNode = get().nodes.find((e) => e.id === trgtId);
    const srcNode = get().nodes.find((e) => e.id === srcId);
    const trgtIsAQueue = trgtNode?.data.role === 'q';
    const srcIsAQueue = srcNode?.data.role === 'q';

    let setConnection = false;
    let queueName = '';

    if (trgtIsAQueue && !srcIsAQueue) {
      queueName = (trgtNode!.data as { queueName: string }).queueName;
      if (queueName) {
        set({
          nodes: get().nodes.map((node) => {
            if (node.id === srcId) {
              node = {
                ...node,
                data: {
                  ...node.data,
                  connectedQueue: queueName,
                  subscriptionState: 0,
                },
              } as typeof node;
            }
            return node;
          }) as MQFlowNode[],
        });
        setConnection = true;
      }
    } else if (srcIsAQueue && !trgtIsAQueue) {
      queueName = (srcNode!.data as { queueName: string }).queueName;
      if (queueName) {
        set({
          nodes: get().nodes.map((node) => {
            if (node.id === trgtId) {
              node = {
                ...node,
                data: {
                  ...node.data,
                  connectedQueue: queueName,
                  subscriptionState: 0,
                },
              } as typeof node;
            }
            return node;
          }) as MQFlowNode[],
        });
        setConnection = true;
      }
    }
    return setConnection;
  }

  disabledNonConnetedQueue(
    set: ZustandSet<StoreSlice>,
    get: ZustandGet<StoreSlice>,
    oldEdge: MQFlowEdge,
    connection: Connection
  ): void {
    const nodeIdChanged =
      oldEdge.source === connection.source ? oldEdge.target : oldEdge.source;
    const nodeIdConnected =
      oldEdge.source === connection.source
        ? connection.target
        : connection.source;

    let isActiveNode = false;
    let isToAQueue = false;

    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeIdChanged) {
          node = {
            ...node,
            data: {
              ...node.data,
              isActive: false,
              connectedQueue: '',
            },
          } as typeof node;
        }
        if (node.id === nodeIdConnected && node.type === 'queue') {
          isToAQueue = true;
        } else if (node.id === nodeIdConnected && node.type !== 'queue') {
          isActiveNode = (node.data as { isActive: boolean }).isActive;
        }
        return node;
      }) as MQFlowNode[],
    });

    if (!isToAQueue) {
      set({
        edges: get().edges.map((edge) => {
          if (
            edge.source === nodeIdConnected ||
            edge.target === nodeIdConnected
          ) {
            edge = {
              ...edge,
              animated: isActiveNode,
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
  }

  // Active nodes are either the consumer or the producer
  refreshEdgeStateOnConnection(
    _set: ZustandSet<StoreSlice>,
    _get: ZustandGet<StoreSlice>,
    _activeNode: MQFlowNode
  ): void {}

  animateEdgeFromNodeIds(
    set: ZustandSet<StoreSlice>,
    get: ZustandGet<StoreSlice>,
    nodeId: string
  ): void {
    set({
      edges: get().edges.map((edge) => {
        if (edge.source === nodeId || edge.target === nodeId) {
          return {
            ...edge,
            animated: !edge.animated,
            style: { stroke: '#0050e6', strokeWidth: 1.5 },
          };
        }
        return edge;
      }),
    });
  }

  animateEdgeFromProducer(
    set: ZustandSet<StoreSlice>,
    get: ZustandGet<StoreSlice>,
    nodeId: string,
    state: boolean,
    isFromEdge = false
  ): void {
    set({
      edges: get().edges.map((edge) => {
        if (edge.source === nodeId || (isFromEdge && edge.id === nodeId)) {
          return {
            ...edge,
            animated: state,
            style: { stroke: '#0050e6', strokeWidth: 1.5 },
          };
        }
        return edge;
      }),
    });
  }

  animateEdgeFromConnection(
    set: ZustandSet<StoreSlice>,
    get: ZustandGet<StoreSlice>,
    source: string,
    target: string
  ): void {
    set({
      edges: get().edges.map((edge) => {
        if (
          (edge.source === source && edge.target === target) ||
          (edge.target === source && edge.source === target)
        ) {
          return {
            ...edge,
            animated: true,
            style: { stroke: '#0050e6', strokeWidth: 1.5 },
          };
        }
        return edge;
      }),
    });
  }

  setActiveNodeAndAnimateFromNodeId(
    set: ZustandSet<StoreSlice>,
    get: ZustandGet<StoreSlice>,
    nodeId: string
  ): void {
    const currentNode = get().nodes.find((n) => n.id === nodeId);
    const newIsActive = currentNode
      ? !(currentNode.data as { isActive: boolean }).isActive
      : false;

    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          node = {
            ...node,
            data: {
              ...node.data,
              isActive: newIsActive,
            },
          } as typeof node;
        }
        return node;
      }) as MQFlowNode[],
      edges: get().edges.map((edge) => {
        if (edge.source === nodeId || edge.target === nodeId) {
          return {
            ...edge,
            animated: newIsActive,
            style: { stroke: '#0050e6', strokeWidth: 1.5 },
          };
        }
        return edge;
      }),
    });
  }

  drawConnectionNodeToQueueFromConnection(
    set: ZustandSet<StoreSlice>,
    get: ZustandGet<StoreSlice>,
    connection: Pick<Connection, 'source' | 'target'>
  ): void {
    const e: MQFlowEdge = {
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

  updateQueueOnDeletingEdge(
    set: ZustandSet<StoreSlice>,
    get: ZustandGet<StoreSlice>,
    edgeId: string,
    isSub = false
  ): void {
    const split = edgeId.split('-');
    const srcId = split[0];
    const targetId = split[1];

    set({
      nodes: get().nodes.map((node) => {
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
          } as typeof node;
        }
        return node;
      }) as MQFlowNode[],
    });
  }

  getEdgesFromNode(
    _set: ZustandSet<StoreSlice>,
    get: ZustandGet<StoreSlice>,
    nodeId: string
  ): MQFlowEdge[] {
    return get().edges.filter(
      (edge) => edge.source === nodeId || edge.target === nodeId
    );
  }
}

export default MapUtils;
