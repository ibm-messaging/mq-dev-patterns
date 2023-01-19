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
    id: '15',
    type: 'producer',
    data: {
      role: 'Producer',
      label: 'Partecipants checker',
      connectedQueue: 'DEV.QUEUE.3',
      isActive: false,
    },
    position: { x: 200, y: 62 },
    sourcePosition: 'right',
    targetPosition: 'right',
    draggable: true,
  },
  {
    id: '16',
    type: 'consumer',
    data: {
      role: 'Consumer',
      label: 'Partecipant confirmation',
      connectedQueue: 'DEV.QUEUE.3',
      isActive: false,
    },
    position: { x: 1350, y: 50 },
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
export default initialNodes;
