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

import React, { useEffect, useId, useRef, useState } from 'react';
import './QueueVisualizer.scss';
const MAX_SLOTS = 5;
const INNER_X = 12.8;
const INNER_W = 27.2 - 12.8;
const INNER_BOT = 33.8;
const PLATE_H = 3.2;
const PLATE_GAP = 1.2;
const PLATE_RX = 0.4;

const slotY = i => INNER_BOT - (i + 1) * PLATE_H - i * PLATE_GAP;

const QueueVisualizer = ({
  depth = 0,
  size = 64,
  landCount = 0,
  drainCount = 0,
}) => {
  const uid = useId();
  const clipId = `qv-clip-${uid.replace(/:/g, '')}`;

  const [filled, setFilled] = useState(() => Math.min(depth, MAX_SLOTS));

  const prevLandRef = useRef(landCount);
  const prevDrainRef = useRef(drainCount);

  useEffect(() => {
    const delta = landCount - prevLandRef.current;
    if (delta <= 0) return;
    prevLandRef.current = landCount;
    setFilled(cur => Math.min(cur + delta, MAX_SLOTS));
  }, [landCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const delta = drainCount - prevDrainRef.current;
    if (delta <= 0) return;
    prevDrainRef.current = drainCount;
    setFilled(cur => Math.max(cur - delta, 0));
  }, [drainCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const slots = Array.from({ length: MAX_SLOTS }, (_, i) => i < filled);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      focusable="false">
      <defs>
        <clipPath id={clipId}>
          <path d="M29 8.40002H11V33.8H29V8.40002Z" />
        </clipPath>
      </defs>

      <path
        d="M2.79999 4.80005H8.79999V32.8C8.79999 34.9334 9.86665 36 12 36H28C30.1333 36 31.2 34.9334 31.2 32.8V4.80005H37.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <g clipPath={`url(#${clipId})`}>
        {slots.map((isFilled, i) => {
          const y = slotY(i);
          const cx = INNER_X + INNER_W / 2;
          const cy = y + PLATE_H / 2;
          return (
            <g
              key={i}
              className={`queue-visualizer__slot ${
                isFilled ? 'queue-visualizer__slot--filled' : ''
              }`}
              style={{ transformOrigin: `${cx}px ${cy}px` }}>
              <rect
                x={INNER_X}
                y={y}
                width={INNER_W}
                height={PLATE_H}
                rx={PLATE_RX}
                fill="#3D6BCE"
              />
              <polyline
                points={`${INNER_X},${y} ${cx},${y + PLATE_H * 0.55} ${INNER_X +
                  INNER_W},${y}`}
                stroke="white"
                strokeWidth="0.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default QueueVisualizer;
