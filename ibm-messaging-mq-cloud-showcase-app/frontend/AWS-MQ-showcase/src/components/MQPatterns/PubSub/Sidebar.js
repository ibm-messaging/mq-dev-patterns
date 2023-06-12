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

import React, { useState, useEffect } from 'react';
import '../../Map/map.css';

function Sidebar() {
  const [isBigScreen, setIsBigScreen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsBigScreen(window.innerWidth >=1000); // Adjust the breakpoint as needed
    };

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Call handleResize initially
    handleResize();

    // Clean up the event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <>
      {isBigScreen && (
        <aside style={{ width: 170 }}>
          <div className="description">Add new elements to your model!</div>
          <div
            title="Producer"
            className="dndnode producer"
            onDragStart={(event) => onDragStart(event, 'producer')}
            draggable
          />
          <div
            title="Queue"
            className="dndnode queue"
            onDragStart={(event) => onDragStart(event, 'queue')}
            draggable
          />
          <div
            title="Consumer"
            className="dndnode consumer"
            onDragStart={(event) => onDragStart(event, 'consumer')}
            draggable
          />
        </aside>
      )}
    </>
  );
}

export default Sidebar;
