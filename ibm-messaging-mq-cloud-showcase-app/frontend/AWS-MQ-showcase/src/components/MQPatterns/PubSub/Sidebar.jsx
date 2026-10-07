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
import { MediaCast } from '@carbon/react/icons';
import AppIcon from '../../Map/AppIcon';
import PatternSidebar from '../../Map/PatternSidebar';

const ITEMS = [
  {
    nodeType: 'producer',
    icon: <AppIcon size={24} />,
    label: 'Publisher app',
    description: 'Publishes notifications to a topic',
  },
  {
    nodeType: 'queue',
    icon: <MediaCast size={24} />,
    label: 'Topic',
    description: 'Routes messages to subscribers',
  },
  {
    nodeType: 'consumer',
    icon: <AppIcon size={24} />,
    label: 'Subscriber',
    description: 'Receives topic notifications',
  },
];

const HOW_IT_WORKS = {
  patternName: 'publish-subscribe',
  tags: ['MQTT', 'REST', 'AMQP', 'JMS', 'Jakarta Msg 3.0'],
  description:
    'Publish-subscribe messaging is a one-to-many distribution pattern. Unlike point-to-point messaging, a copy of the message is delivered to every consumer (subscriber) that has registered interest in a topic. This pattern forms the basic framework of event distribution and Event Driven Architectures (EDAs).',
  steps: [
    'Message consumers subscribe to a topic relating to events they are interested in',
    'Messages producer publishes message to a topic',
    'Message broker matches subscribers for topic where new events has been published',
    'A copy of the event message is delivered to all matching subscribers of the topic',
  ],
};

const Sidebar = () => (
  <PatternSidebar
    items={ITEMS}
    instruction="Drag onto canvas. Connect publisher to topic, topic to subscribers. Toggle subscriber on to receive."
    howItWorks={HOW_IT_WORKS}
  />
);

export default Sidebar;
