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

import React, { useState, useEffect } from 'react';
import './PatternSidebar.scss';

const PatternSidebar = ({
  items = [],
  instruction = 'Drag onto canvas. Connect handles. Toggle consumer on to start receiving.',
}) => {
  const [isBigScreen, setIsBigScreen] = useState(
    () => window.innerWidth >= 1000
  );

  useEffect(() => {
    const handleResize = () => setIsBigScreen(window.innerWidth >= 1000);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  if (!isBigScreen) return null;

  return (
    <aside className="pattern-sidebar">
      <p className="pattern-sidebar__heading">Add elements</p>

      <div className="pattern-sidebar__items">
        {items.map(({ nodeType, icon, label, description }) => (
          <div
            key={nodeType}
            className="pattern-sidebar__card"
            draggable
            onDragStart={event => onDragStart(event, nodeType)}>
            <div className="pattern-sidebar__card-icon">{icon}</div>
            <div className="pattern-sidebar__card-text">
              <span className="pattern-sidebar__card-label">{label}</span>
              <span className="pattern-sidebar__card-description">
                {description}
              </span>
            </div>
          </div>
        ))}
      </div>

      <hr className="pattern-sidebar__divider" />

      <p className="pattern-sidebar__instruction">{instruction}</p>
    </aside>
  );
};

export default PatternSidebar;
