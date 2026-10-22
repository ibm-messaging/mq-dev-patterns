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

const EDGE_STYLE = { stroke: '#0050e6', strokeWidth: 1.5 };

function dispatchMessageFlow(edgeId: string, reverse?: boolean): void {
  window.dispatchEvent(
    new CustomEvent('mq-message-flow', {
      detail: {
        edgeId,
        id: Math.random().toString(36).slice(2),
        ...(reverse && { reverse }),
      },
    })
  );
}

export function emitMessageFlow(edgeId: string): void {
  dispatchMessageFlow(edgeId);
}

export function emitMessageFlowReverse(edgeId: string): void {
  dispatchMessageFlow(edgeId, true);
}

/** Returns a copy of `nodes` with `patch` merged into the data of node `id`. */
function patchNodeData(
  nodes: MQFlowNode[],
  id: string,
  patch: Record<string, unknown>
): MQFlowNode[] {
  return nodes.map((node) =>
    node.id === id
      ? ({ ...node, data: { ...node.data, ...patch } } as MQFlowNode)
      : node
  );
}

function withEdgeState(edge: MQFlowEdge, animated: boolean): MQFlowEdge {
  return { ...edge, animated, style: EDGE_STYLE };
}

class MapUtils {
  updateConnectionNodeToQueue(
    set: ZustandSet<StoreSlice>,
    get: ZustandGet<StoreSlice>,
    connection: Connection
  ): boolean {
    const srcId = connection['source'];
    const trgtId = connection['target'];
    const trgtNode = get().nodes.find((e) => e.id === trgtId);
    const srcNode = get().nodes.find((e) => e.id === srcId);
    const trgtIsAQueue = trgtNode?.data.role === 'q';
    const srcIsAQueue = srcNode?.data.role === 'q';

    let nodeIdToConnect: string | undefined;
    let queueName = '';

    if (trgtIsAQueue && !srcIsAQueue) {
      queueName = (trgtNode.data as { queueName: string }).queueName;
      nodeIdToConnect = srcId;
    } else if (srcIsAQueue && !trgtIsAQueue) {
      queueName = (srcNode.data as { queueName: string }).queueName;
      nodeIdToConnect = trgtId;
    }

    if (!queueName || !nodeIdToConnect) {
      return false;
    }
    set({
      nodes: patchNodeData(get().nodes, nodeIdToConnect, {
        connectedQueue: queueName,
        subscriptionState: 0,
      }),
    });
    return true;
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

    const nodes = patchNodeData(get().nodes, nodeIdChanged, {
      isActive: false,
      connectedQueue: '',
    });
    set({ nodes });

    const connectedNode = nodes.find((node) => node.id === nodeIdConnected);
    if (connectedNode?.type === 'queue') {
      return;
    }
    const isActiveNode = (connectedNode?.data as { isActive?: boolean })
      ?.isActive;
    set({
      edges: get().edges.map((edge) =>
        edge.source === nodeIdConnected || edge.target === nodeIdConnected
          ? withEdgeState(edge, Boolean(isActiveNode))
          : edge
      ),
    });
  }

  animateEdgeFromNodeIds(
    set: ZustandSet<StoreSlice>,
    get: ZustandGet<StoreSlice>,
    nodeId: string
  ): void {
    set({
      edges: get().edges.map((edge) =>
        edge.source === nodeId || edge.target === nodeId
          ? withEdgeState(edge, !edge.animated)
          : edge
      ),
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
      edges: get().edges.map((edge) =>
        edge.source === nodeId || (isFromEdge && edge.id === nodeId)
          ? withEdgeState(edge, state)
          : edge
      ),
    });
  }

  animateEdgeFromConnection(
    set: ZustandSet<StoreSlice>,
    get: ZustandGet<StoreSlice>,
    source: string,
    target: string
  ): void {
    set({
      edges: get().edges.map((edge) =>
        (edge.source === source && edge.target === target) ||
        (edge.target === source && edge.source === target)
          ? withEdgeState(edge, true)
          : edge
      ),
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
      nodes: patchNodeData(get().nodes, nodeId, { isActive: newIsActive }),
      edges: get().edges.map((edge) =>
        edge.source === nodeId || edge.target === nodeId
          ? withEdgeState(edge, newIsActive)
          : edge
      ),
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
      nodes: get().nodes.map((node) =>
        (node.id === srcId || node.id === targetId) &&
        (node.type === 'producer' || node.type === 'consumer')
          ? patchNodeData([node], node.id, {
              connectedQueue: '',
              isActive: false,
              subscriptionState: isSub ? 2 : undefined,
            })[0]
          : node
      ),
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
