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
