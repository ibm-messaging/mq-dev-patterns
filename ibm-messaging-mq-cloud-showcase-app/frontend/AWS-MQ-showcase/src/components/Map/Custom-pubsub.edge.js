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
import {
  getBezierPath,  
  getSmoothStepPath,  
} from 'react-flow-renderer';
import useStore from '../MQPatterns/PubSub/store';
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
  const edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const _deleteOnClick = useStore(state => state.onDeleteEdge);
  const [messageX, setMessageX] = useState();
  const [messageY, setMessageY] = useState();
  const TRANSITION_TIME = 300;

  const calculateLabelPosition = () => {
    let _edgePathPoints = edgePath.split(' ');
    let sumX = 0;
    let sumY = 0;
    let _3mainPoints = [];
    _edgePathPoints.forEach((x, i) => {
      let c = x.split(',');
      if (i === 0 || i === 1) {
        c[0] = c[0].substring(1);
      }
      let _x = parseFloat(c[0]);
      let _y = parseFloat(c[1]);
      sumX += _x;
      sumY += _y;
      _3mainPoints.push([_x, _y]);
    });
    let xPosition = sumX / _edgePathPoints.length;
    let yPosition = sumY / _edgePathPoints.length;

    return [xPosition, yPosition, _3mainPoints];
  };

  const [animationCounter, setAnimationCounter] = useState(0);

  useEffect(() => {
    let _3mainPoints = calculateLabelPosition()[2];
    if (animated && animationCounter === 0) {
      setMessageX(_3mainPoints[0][0]);
      setMessageY(_3mainPoints[0][1]);
      setAnimationCounter(1);
    } else if (animated && animationCounter === 1) {
      setTimeout(() => {
        setMessageX(parseInt(calculateLabelPosition()[0]));
        setMessageY(parseInt(calculateLabelPosition()[1]));
        setAnimationCounter(2);
      }, TRANSITION_TIME);
    } else if (animated && animationCounter === 2) {
      setTimeout(() => {
        setMessageX(_3mainPoints[3][0]);
        setMessageY(_3mainPoints[3][1]);
        setAnimationCounter(3);
      }, TRANSITION_TIME);
    } else if (animated && animationCounter === 3) {
      setTimeout(() => {
        //animateConnection(id, false, true);
        setAnimationCounter(0);
      }, TRANSITION_TIME);
    }
  });

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
        x={parseInt(calculateLabelPosition()[0]) - foreignObjectSize / 2}
        y={parseInt(calculateLabelPosition()[1]) - foreignObjectSize / 2}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml">
        <body>
          <button
            className="edgebutton"
            too
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
            <div style={{ background: '#0059ff' }} className="messageOnEdge" />
          </body>
        </foreignObject>
      ) : (
        <></>
      )}
    </>
  );
}
