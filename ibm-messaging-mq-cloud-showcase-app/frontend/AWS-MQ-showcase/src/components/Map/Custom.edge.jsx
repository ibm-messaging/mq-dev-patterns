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

import React, { useEffect, useState } from 'react';
import { getBezierPath } from '@xyflow/react';
import useStore from '../MQPatterns/PointToPoint/store';
import './map.css';

const foreignObjectSize = 40;

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  animated,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const _deleteOnClick = useStore(state => state.onDeleteEdge);
  const [messageX, setMessageX] = useState(labelX);
  const [messageY, setMessageY] = useState(labelY);
  const [messageColour, setMessageColour] = useState(getRandomColor());
  const TRANSITION_TIME = 660;

  function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  const [animationCounter, setAnimationCounter] = useState(0);

  useEffect(() => {
    if (animated && animationCounter === 0) {
      setMessageX(sourceX);
      setMessageY(sourceY);
      setAnimationCounter(1);
    } else if (animated && animationCounter === 1) {
      const t = setTimeout(() => {
        setMessageX(labelX);
        setMessageY(labelY);
        setAnimationCounter(2);
      }, TRANSITION_TIME);
      return () => clearTimeout(t);
    } else if (animated && animationCounter === 2) {
      const t = setTimeout(() => {
        setMessageX(targetX);
        setMessageY(targetY);
        setAnimationCounter(3);
      }, TRANSITION_TIME);
      return () => clearTimeout(t);
    } else if (animated && animationCounter === 3) {
      const t = setTimeout(() => {
        setAnimationCounter(0);
        setMessageColour(getRandomColor());
      }, TRANSITION_TIME);
      return () => clearTimeout(t);
    }
  }, [animated, animationCounter]);

  const onEdgeClick = (evt, id) => {
    evt.stopPropagation();
    _deleteOnClick(id);
  };

  return (
    <>
      <path
        type="straight"
        id={sourceX + '-' + sourceY}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        connectionLineType={'straight'}
      />

      <foreignObject
        width={foreignObjectSize}
        height={foreignObjectSize}
        x={labelX - foreignObjectSize / 2}
        y={labelY - foreignObjectSize / 2}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml">
        <body>
          <button
            className="edgebutton"
            onClick={event => onEdgeClick(event, id)}>
            X
          </button>
        </body>
      </foreignObject>

      {animated ? (
        <foreignObject
          width={40}
          height={35}
          x={messageX - 40 / 2}
          y={messageY - 35 / 2}
          className="edgebutton-foreignobject"
          requiredExtensions="http://www.w3.org/1999/xhtml">
          <body>
            <div
              style={{ background: messageColour }}
              className="messageOnEdge"
            />
          </body>
        </foreignObject>
      ) : (
        <></>
      )}
    </>
  );
}
