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
    label: 'Requestor app',
    description: 'Sends requests and waits for replies',
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
    label: 'Responder app',
    description: 'Processes requests and replies',
  },
];

const HOW_IT_WORKS = {
  patternName: 'request-response',
  tags: ['MQTT', 'REST', 'AMQP', 'JMS', 'Jakarta Msg 3.0'],
  description:
    'Request-response messaging facilitates a conversational exchange in an asynchronous framework. Whereas queues and topics enable the movement of data in one direction, request-response extends this further by allowing bi-directional communication. This is a versatile pattern that can combine both point-to-point and publish-subscribe communication frameworks.',
  steps: [
    'Message producer connects to the queue manager and creates a temporary reply-to destination',
    'Producer sends a request message with the reply-to property set to the reply-to destination',
    'Response application consumes the request and begins processing',
    'Response application sends a reply message to the reply-to destination',
    'Original producer consumes the reply message and correlates with original request message',
  ],
};

const Sidebar = () => (
  <PatternSidebar
    items={ITEMS}
    instruction="Submit a request — a temporary reply queue is auto-created. Toggle responder on to process it and send a reply."
    howItWorks={HOW_IT_WORKS}
  />
);

export default Sidebar;
