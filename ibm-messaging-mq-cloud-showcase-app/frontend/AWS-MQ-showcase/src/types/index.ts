/**
 * Copyright 2026 IBM Corp.
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

import type {
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';

// ── Node data payloads ──────────────────────────────────────────────────────

export interface ProducerNodeData extends Record<string, unknown> {
  role: 'Producer';
  label: string;
  connectedQueue: string;
  isActive: boolean;
}

export interface ConsumerNodeData extends Record<string, unknown> {
  role: 'Consumer';
  label: string;
  connectedQueue: string;
  isActive: boolean;
  /** 0 = unsubscribed, 1 = subscribed, 2 = unsubscribing */
  subscriptionState?: 0 | 1 | 2;
}

export interface QueueNodeData extends Record<string, unknown> {
  role: 'q';
  depth: number;
  queueName: string;
  /** Optimistic counter — incremented by sendMessages/publisherSent store actions */
  landCount?: number;
  /** Optimistic counter — incremented by consumeMessageFromQueue/drainMessageFromQueue */
  drainCount?: number;
  /** True for temporary reply queues created by the Request/Response pattern */
  isReplyQueue?: boolean;
}

/** Topic nodes in PubSub reuse the queue data shape */
export type TopicNodeData = QueueNodeData;

/** BasicNode — legacy, used in Basic.node only */
export interface BasicNodeData extends Record<string, unknown> {
  role: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

// ── @xyflow/react typed node wrappers ───────────────────────────────────────

export type ProducerFlowNode = Node<ProducerNodeData, 'producer'>;
export type ConsumerFlowNode = Node<ConsumerNodeData, 'consumer'>;
export type QueueFlowNode = Node<QueueNodeData, 'queue'> & { isAqueue?: 1 };
export type MQFlowNode = ProducerFlowNode | ConsumerFlowNode | QueueFlowNode;
export type MQFlowEdge = Edge;

// ── API response shapes ─────────────────────────────────────────────────────

export interface QueueDepth {
  name: string;
  depth: number;
  maxDepth?: number;
}

export interface MQMessage {
  Message: string;
  Count?: number;
  Sent?: string;
  id?: string;
}

export interface CodingChallengeResult {
  message: { Message: string; Sent?: string; count?: number };
  currency: string;
}

export interface SubMessage {
  Title: string;
  Message: string;
  Count: number;
  Date: string;
  id: string;
}

export interface DynPutResult {
  _name: string;
  [key: string]: unknown;
}

export interface DynGetResult {
  message: MQMessage;
  replyQueue: string;
}

// ── Zustand helper types ────────────────────────────────────────────────────

export type ZustandSet<S> = (
  partial: Partial<S> | ((state: S) => Partial<S>)
) => void;
export type ZustandGet<S> = () => S;

// ── Shared depth-tracking state (P2P and RR stores) ─────────────────────────

export interface DepthTrackingState {
  nodeDepths: Record<string, number>;
  localDepths: Record<string, number>;
  setNodeDepth: (nodeId: string, depth: number) => void;
}

// ── Shared Zustand store base ────────────────────────────────────────────────

export interface BaseStoreState {
  nodes: MQFlowNode[];
  edges: MQFlowEdge[];
  onNodesChange: (changes: NodeChange<MQFlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<MQFlowEdge>[]) => void;
  onReconnect: (oldEdge: MQFlowEdge, connection: Connection) => void;
  onConnect: (connection: Connection) => void;
  onClick: (nodeId: string) => void;
  changeEdgeAnimationFromNodeId: (
    nodeId: string,
    state: boolean,
    isFromEdge?: boolean
  ) => void;
  onDeleteEdge: (edgeId: string) => void;
  onDeleteNode: (nodeId: string, isAQueue?: boolean) => void;
  addNode: (node: MQFlowNode) => void;
  getQueuesNodes: () => QueueFlowNode[];
}

// ── PointToPoint store ───────────────────────────────────────────────────────

export interface P2PStoreState extends BaseStoreState, DepthTrackingState {
  queueData: QueueDepth[];
  updateQueueData: (data: QueueDepth[]) => void;
  sendMessages: (nodeId: string, count: number) => void;
  consumeMessageFromQueue: (consumerNodeId: string) => void;
}

// ── PubSub store ─────────────────────────────────────────────────────────────

export interface PubSubTopicEntry {
  id: string;
  text: string;
}

export interface DataframeEntry {
  group: string;
  value: number;
}

export interface PubSubStoreState extends BaseStoreState {
  dataframe: DataframeEntry[];
  reset: () => void;
  updateTopicName: (id: string, inputText: string) => void;
  setDataframeForChart: () => DataframeEntry[];
  deleteEdgeFromNode: (nodeId: string) => void;
  getAvailableTopic: () => PubSubTopicEntry[];
  publisherSent: (publisherNodeId: string) => void;
  subscriberReceived: (subscriberNodeId: string) => void;
}

// ── RequestResponse store ────────────────────────────────────────────────────

export interface RRStoreState extends BaseStoreState, DepthTrackingState {
  queueData: QueueDepth[];
  updateQueueData: (data: QueueDepth[]) => void;
  sendMessages: (nodeId: string, count: number) => void;
  drainMessageFromQueue: (responderNodeId: string) => void;
  creteTmpQueue: (tmpQueueName: string, requestNodeId: string) => void;
  drawTmpConnection: (
    tmpQueueName: string,
    responderId: string,
    isResp: boolean
  ) => void;
  animateTmpConnection: (tmpQueueName: string, responderId: string) => void;
  deleteEdgeFromConnection: (tmpQueueName: string, responderId: string) => void;
  deleteTmpQueueFromTmpQueueName: (tmpQueueName: string) => void;
}

// ── Chart data types ─────────────────────────────────────────────────────────

export interface LineChartEntry {
  group: string;
  time: number;
  value: number;
}

export interface BarChartEntry {
  group: string;
  key: string;
  value: number;
}

// ── RepoPage types ───────────────────────────────────────────────────────────

export interface RepoTableHeader {
  key: string;
  header: string;
}

export interface RepoRow {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  issueCount: string;
  stars: string;
  links: string;
}
