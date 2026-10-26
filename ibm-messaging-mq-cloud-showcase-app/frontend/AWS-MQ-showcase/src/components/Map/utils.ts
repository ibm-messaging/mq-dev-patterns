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
import { green10, blue10, blue60Hover } from '@carbon/colors';
import type { Connection } from '@xyflow/react';
import type {
  DepthTrackingState,
  MQFlowNode,
  MQFlowEdge,
  QueueFlowNode,
  ZustandSet,
  ZustandGet,
} from '../../types';
import {
  layer01,
  borderSubtle01,
  supportSuccess,
  interactive,
} from '@carbon/themes';

export const SHOWCASE_APP_CONSTANTS = {
  CURRENCY_ITEMS: [
    { id: '1', text: 'EUR' },
    { id: '2', text: 'USD' },
    { id: '3', text: 'GBP' },
  ],
  HEADER_BG_ACTIVE: green10,
  HEADER_BORDER_ACTIVE: supportSuccess,
  HEADER_BG_IDLE: layer01,
  HEADER_BORDER_IDLE: borderSubtle01,
  HEADER_BG_BLUE: blue10,
  HEADER_BORDER_BLUE: interactive,
};
interface StoreSlice {
  nodes: MQFlowNode[];
  edges: MQFlowEdge[];
}

/** Default 1px edge style for connections between flow nodes. */
export const EDGE_STYLE_THIN = { stroke: blue60Hover, strokeWidth: 1 };

const EDGE_STYLE = { stroke: blue60Hover, strokeWidth: 1.5 };

export function isQueueNode(node?: MQFlowNode): node is QueueFlowNode {
  return node?.data.role === 'q';
}

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
export function patchNodeData(
  nodes: MQFlowNode[],
  id: string,
  patch: Record<string, unknown>
): MQFlowNode[] {
  return nodes.map((node) =>
    node.id === id
      ? ({ ...node, data: { ...node.data, ...patch } } as MQFlowNode) // cast: spread of a union member plus a partial patch widens past MQFlowNode
      : node
  );
}

/**
 * Returns `nodes` with the optimistic `counter` of queue node `id` incremented.
 * Returns `nodes` unchanged when `id` is not a queue node.
 */
export function bumpQueueCounter(
  nodes: MQFlowNode[],
  id: string,
  counter: 'landCount' | 'drainCount'
): MQFlowNode[] {
  const target = nodes.find((node) => node.id === id);
  if (!isQueueNode(target)) return nodes;
  return patchNodeData(nodes, id, {
    [counter]: (target.data[counter] ?? 0) + 1,
  });
}

/** Current depth of queue `id`: local estimate, else API depth, else `fallback`. */
export function getQueueDepth(
  {
    localDepths,
    nodeDepths,
  }: Pick<DepthTrackingState, 'localDepths' | 'nodeDepths'>,
  id: string,
  fallback = 0
): number {
  return localDepths[id] ?? nodeDepths[id] ?? fallback;
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
    const trgtIsAQueue = isQueueNode(trgtNode);
    const srcIsAQueue = isQueueNode(srcNode);

    let nodeIdToConnect: string | undefined;
    let queueName = '';

    if (trgtIsAQueue && !srcIsAQueue) {
      queueName = trgtNode.data.queueName;
      nodeIdToConnect = srcId;
    } else if (srcIsAQueue && !trgtIsAQueue) {
      queueName = srcNode.data.queueName;
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
    const isActiveNode = connectedNode?.data.isActive;
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
    const newIsActive = currentNode ? !currentNode.data.isActive : false;

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
      style: EDGE_STYLE_THIN,
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
