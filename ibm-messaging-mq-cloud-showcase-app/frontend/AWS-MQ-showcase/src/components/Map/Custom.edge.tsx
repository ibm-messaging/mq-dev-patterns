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

import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, RefObject } from 'react';
import { getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { blue50, blue60, blue60Hover, blue70, blue80 } from '@carbon/colors';
import useStore from '../MQPatterns/PointToPoint/store';
import './map.scss';

const foreignObjectSize = 40;
const DURATION = 950;
const REMOVE_AFTER = DURATION + 100;

interface Particle {
  id: string;
  reverse: boolean;
  color: string;
}

function MessageIcon({ color }: { color: string }) {
  return (
    <g>
      <rect x="-9" y="-6" width="18" height="13" rx="2" fill={color} />
      <polyline
        points="-9,-6 0,2 9,-6"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
      />
    </g>
  );
}

interface AnimatedParticleProps {
  pathRef: RefObject<SVGPathElement | null>;
  reverse: boolean;
  color: string;
}

function AnimatedParticle({ pathRef, reverse, color }: AnimatedParticleProps) {
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let raf: number;
    const waitForPath = () => {
      const pathEl = pathRef.current;
      if (!pathEl || !gRef.current) {
        raf = requestAnimationFrame(waitForPath);
        return;
      }
      const el = gRef.current;
      const start = performance.now();

      const tick = (now: number) => {
        const t = Math.min((now - start) / DURATION, 1);

        const ease = t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2;

        const len = pathEl.getTotalLength();
        const dist = reverse ? (1 - ease) * len : ease * len;
        const pt = pathEl.getPointAtLength(dist);

        el.setAttribute('transform', `translate(${pt.x},${pt.y})`);

        if (t < 1) {
          raf = requestAnimationFrame(tick);
        }
      };

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(waitForPath);
    return () => cancelAnimationFrame(raf);
  }, [pathRef, reverse]);

  return (
    <g ref={gRef}>
      <MessageIcon color={color} />
    </g>
  );
}

const COLORS = [blue60, blue60Hover, blue50, blue70, blue80];
function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const _deleteOnClick = useStore((state) => state.onDeleteEdge);

  const pathRef = useRef<SVGPathElement>(null);

  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const handler = (e: WindowEventMap['mq-message-flow']) => {
      const detail = e.detail;
      if (detail.edgeId !== id) return; // ignore other edges

      const pid = detail.id;
      const rev = !!detail.reverse;
      const col = randomColor();

      setParticles((prev) => [...prev, { id: pid, reverse: rev, color: col }]);

      // Auto-remove after animation completes
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== pid));
      }, REMOVE_AFTER);
    };

    window.addEventListener('mq-message-flow', handler);
    return () => window.removeEventListener('mq-message-flow', handler);
  }, [id]);

  const onEdgeClick = (evt: MouseEvent, edgeId: string) => {
    evt.stopPropagation();
    _deleteOnClick(edgeId);
  };

  return (
    <>
      <path
        ref={pathRef}
        id={`edge-path-${id}`}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />

      <foreignObject
        width={foreignObjectSize}
        height={foreignObjectSize}
        x={labelX - foreignObjectSize / 2}
        y={labelY - foreignObjectSize / 2}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml">
        <div>
          <button
            className="edgebutton"
            onClick={(event) => onEdgeClick(event, id)}>
            X
          </button>
        </div>
      </foreignObject>

      {particles.map((p) => (
        <AnimatedParticle
          key={p.id}
          pathRef={pathRef}
          reverse={p.reverse}
          color={p.color}
        />
      ))}
    </>
  );
}
