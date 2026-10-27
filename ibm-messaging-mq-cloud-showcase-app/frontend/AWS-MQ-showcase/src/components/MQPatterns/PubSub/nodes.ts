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

import { Position } from '@xyflow/react';
import type { MQFlowNode } from '../../../types';

const initialNodes: MQFlowNode[] = [
  {
    id: '1',
    type: 'producer',
    data: {
      role: 'Producer',
      label: 'Publisher',
      connectedQueue: 'tickets/classic',
      isActive: false,
    },
    position: { x: 50, y: 40 },
    sourcePosition: Position.Right,
    draggable: true,
  },
  {
    id: '2',
    type: 'queue',
    data: {
      role: 'q',
      depth: 0,
      queueName: 'tickets/classic',
    },
    position: { x: 550, y: 110 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: true,
  },
  {
    id: '3',
    type: 'consumer',
    data: {
      role: 'Consumer',
      label: 'Classic consumer 1',
      connectedQueue: 'tickets/classic',
      subscriptionState: 0,
    },
    position: { x: 1050, y: -10 },
    targetPosition: Position.Left,
    draggable: true,
  },
  {
    id: '4',
    type: 'consumer',
    data: {
      role: 'Consumer',
      label: 'Classic consumer 2',
      connectedQueue: 'tickets/classic',
      subscriptionState: 0,
    },
    position: { x: 1050, y: 275 },
    targetPosition: Position.Left,
    draggable: true,
  },
  {
    id: '5',
    type: 'consumer',
    data: {
      role: 'Consumer',
      label: 'VIP Consumer',
      connectedQueue: 'tickets/VIP',
      subscriptionState: 0,
    },
    position: { x: 1050, y: 560 },
    targetPosition: Position.Left,
    draggable: true,
  },
  {
    id: '6',
    type: 'producer',
    data: {
      role: 'Producer',
      label: 'Publisher',
      connectedQueue: 'tickets/VIP',
      isActive: false,
    },
    position: { x: 50, y: 450 },
    sourcePosition: Position.Right,
    draggable: true,
  },
  {
    id: '7',
    type: 'queue',
    data: {
      role: 'q',
      depth: 0,
      queueName: 'tickets/VIP',
    },
    position: { x: 550, y: 500 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: true,
  },
  {
    id: '8',
    type: 'queue',
    data: {
      role: 'q',
      depth: 0,
      queueName: 'tickets/#',
    },
    position: { x: 550, y: 880 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: true,
  },
  {
    id: '9',
    type: 'consumer',
    data: {
      role: 'Consumer',
      label: 'Administrator',
      connectedQueue: 'tickets/#',
      subscriptionState: 0,
    },
    position: { x: 1050, y: 845 },
    targetPosition: Position.Left,
    draggable: true,
  },
];

export default initialNodes;
