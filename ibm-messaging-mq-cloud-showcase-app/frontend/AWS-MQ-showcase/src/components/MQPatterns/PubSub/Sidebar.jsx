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

const Sidebar = () => (
  <PatternSidebar
    items={ITEMS}
    instruction="Drag onto canvas. Connect publisher to topic, topic to subscribers. Toggle subscriber on to receive."
  />
);

export default Sidebar;
