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

const initialNodes = [  
  {
    id: '1',
    type: 'producer',
    data: {
      role: 'Producer',
      label: 'Tickets Generator',
      connectedQueue: 'DEV.QUEUE.1',
      isActive: false,
    },
    position: { x: 200, y: 62 },
    sourcePosition: 'right',
    draggable: true,
  },
  {
    id: '2',
    type: 'consumer',
    data: {
      role: 'Consumer',
      label: 'Customer 2',
      connectedQueue: 'DEV.QUEUE.1',
      isActive: false,
    },
    position: { x: 1350, y: 50 },
    targetPosition: 'left',
    draggable: true,
  },
  {
    id: '3',
    type: 'queue',
    isAqueue: 1,
    data: {
      role: 'q',
      depth: 0,
      queueName: 'DEV.QUEUE.1',
    },
    position: { x: 650, y: 105 },
    sourcePosition: 'right',
    targetPosition: 'left',
    draggable: true,        
  },
  // {
  //   id: '4',
  //   type: 'queue',
  //   isAqueue: 1,
  //   label: 'DEV.QUEUE.2',
  //   data: {
  //     role: 'q',
  //     depth: 0,
  //     queueName: 'DEV.QUEUE.2',
  //   },
  //   position: { x: 650, y: 105 },
  //   sourcePosition: 'right',
  //   targetPosition: 'left',
  //   draggable: false,
  // },
  // {
  //   id: '5',
  //   type: 'queue',
  //   isAqueue: 1,
  //   label: 'DEV.QUEUE.3',
  //   data: {
  //     role: 'q',
  //     depth: 0,
  //     queueName: 'DEV.QUEUE.3',
  //   },
  //   position: { x: 650, y: 205 },
  //   sourcePosition: 'right',
  //   targetPosition: 'left',
  //   draggable: false,
  // },
  // {
  //   id: '6',
  //   type: 'consumer',
  //   data: {
  //     role: 'Consumer',
  //     label: 'Start Consumer',
  //     connectedQueue: 'DEV.QUEUE.1',
  //     isActive: false,
  //   },
  //   position: { x: 1350, y: 160 },
  //   targetPosition: 'left',
  //   draggable: true,
  // },
  // {
  //   id: '7',
  //   type: 'consumer',
  //   data: {
  //     role: 'Consumer',
  //     label: 'Start Consumer',
  //     connectedQueue: '',
  //     isActive: false,
  //   },
  //   position: { x: 1350, y: 200 },
  //   targetPosition: 'left',
  //   draggable: false,
  // },
  // {
  //   id: '8',
  //   type: 'producer',
  //   data: {
  //     role: 'Producer',
  //     label: 'Start Producer',
  //     connectedQueue: '',
  //     isActive: false,
  //   },
  //   position: { x: 200, y: 250 },
  //   sourcePosition: 'right',
  //   draggable: false,
  // },
  // {
  //   id: '9',
  //   type: 'producer',
  //   data: {
  //     role: 'Producer',
  //     label: 'Start Producer',
  //     connectedQueue: '',
  //     isActive: false,
  //   },
  //   position: { x: 200, y: 200 },
  //   sourcePosition: 'right',
  //   draggable: false,
  // },
];
export default initialNodes;