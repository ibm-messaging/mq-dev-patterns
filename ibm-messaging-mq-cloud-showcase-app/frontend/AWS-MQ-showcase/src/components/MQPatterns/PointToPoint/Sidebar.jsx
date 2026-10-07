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

import React from 'react';
import AppIcon from '../../Map/AppIcon';
import QueueIcon from '../../Map/QueueIcon';
import PatternSidebar from '../../Map/PatternSidebar';

const ITEMS = [
  {
    nodeType: 'producer',
    icon: <AppIcon size={24} />,
    label: 'Producer app',
    description: 'Sends messages to a queue',
  },
  {
    nodeType: 'queue',
    icon: <QueueIcon size={24} />,
    label: 'Queue',
    description: 'Buffers and routes messages',
  },
  {
    nodeType: 'consumer',
    icon: <AppIcon size={24} />,
    label: 'Consumer app',
    description: 'Receives messages from queue',
  },
];

const HOW_IT_WORKS = {
  patternName: 'point-to-point',
  tags: ['REST', 'AMQP', 'JMS', 'Jakarta Msg 3.0'],
  description:
    'Point-to-point messaging allows applications to communicate asynchronously. Producers and consumers only need to know about the queue — they have no knowledge of each other and can run at different speeds or at different times.',
  steps: [
    'Messages are put to queue by a producer application',
    'Messages are stored on the queue awaiting consumption',
    'Consumer applications connect to the queue and get (remove) messages in FIFO order',
    'Optionally, applications may browse messages, leaving them on the queue',
  ],
};

const Sidebar = () => (
  <PatternSidebar items={ITEMS} howItWorks={HOW_IT_WORKS} />
);

export default Sidebar;
