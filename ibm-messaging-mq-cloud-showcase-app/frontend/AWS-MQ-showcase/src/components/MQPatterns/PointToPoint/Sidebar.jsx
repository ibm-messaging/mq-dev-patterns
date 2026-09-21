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

const Sidebar = () => <PatternSidebar items={ITEMS} />;

export default Sidebar;
