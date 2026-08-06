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

import React from 'react';
import '../../Map/map.css';

function Sidebar() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside style={{ width: 150 }}>
      <div className="description">
        You can drag these nodes to the pane on the right.
      </div>
      <div
        className="dndnode input"
        onDragStart={event => onDragStart(event, 'producer')}
        draggable>
        Producer
      </div>
      <div
        className="dndnode"
        onDragStart={event => onDragStart(event, 'consumer')}
        draggable>
        Consumer
      </div>
      <div
        className="dndnode output"
        onDragStart={event => onDragStart(event, 'queue')}
        draggable>
        Queue
      </div>
    </aside>
  );
}

export default Sidebar;
