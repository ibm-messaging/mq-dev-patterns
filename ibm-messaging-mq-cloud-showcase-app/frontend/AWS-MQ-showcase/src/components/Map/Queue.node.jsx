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

import React, { useEffect, useRef, useState, memo } from 'react';
import { Handle } from '@xyflow/react';
import { CheckmarkFilled, IbmMq } from '@carbon/react/icons';
import APIAdapter from '../../adapters/API.adapter';
import useP2PStore from '../MQPatterns/PointToPoint/store';
import useRRStore from '../MQPatterns/RequestResponse/store';
import NodeCard from './NodeCard';
import QueueVisualizer from './QueueVisualizer';
import { toast } from 'react-toastify';

const MAX_QUEUE_DEPTH = 500;
const HEADER_BG = '#161616';
const HEADER_BORDER = '#161616';

const QueueNode = ({ id, data, isConnectable }) => {
  const adapter = new APIAdapter();

  const p2pHasNode = useP2PStore(state => state.nodes.some(n => n.id === id));

  const p2pUpdateQueueData = useP2PStore(state => state.updateQueueData);
  const p2pSetNodeDepth = useP2PStore(state => state.setNodeDepth);
  const p2pDeleteMe = useP2PStore(state => state.onDeleteNode);
  const p2pAnimateEdge = useP2PStore(
    state => state.changeEdgeAnimationFromNodeId
  );
  const p2pEdges = useP2PStore(state => state.edges);

  const rrUpdateQueueData = useRRStore(state => state.updateQueueData);
  const rrSetNodeDepth = useRRStore(state => state.setNodeDepth);
  const rrDeleteMe = useRRStore(state => state.onDeleteNode);
  const rrAnimateEdge = useRRStore(
    state => state.changeEdgeAnimationFromNodeId
  );
  const rrEdges = useRRStore(state => state.edges);

  const _updateQueuedata = p2pHasNode ? p2pUpdateQueueData : rrUpdateQueueData;
  const _setNodeDepth = p2pHasNode ? p2pSetNodeDepth : rrSetNodeDepth;
  const deleteMe = p2pHasNode ? p2pDeleteMe : rrDeleteMe;
  const _animateEdgeFromNode = p2pHasNode ? p2pAnimateEdge : rrAnimateEdge;
  const edges = p2pHasNode ? p2pEdges : rrEdges;

  const [currentDepth, setCurrentDepth] = useState(0);
  const prevDepthRef = useRef(0);
  const [landCount, setLandCount] = useState(0);
  const [drainCount, setDrainCount] = useState(0);
  const seenLandRef = useRef(0);
  const seenDrainRef = useRef(0);

  useEffect(() => {
    const delta = (data.landCount || 0) - seenLandRef.current;
    if (delta > 0) {
      seenLandRef.current += delta;
      setLandCount(prev => prev + delta);
    }
  }, [data.landCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const delta = (data.drainCount || 0) - seenDrainRef.current;
    if (delta > 0) {
      seenDrainRef.current += delta;
      setDrainCount(prev => prev + delta);
    }
  }, [data.drainCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const [isTmpQueue, setIsTmpQueue] = useState(
    () => !!data.isReplyQueue || data.queueName.indexOf('APP.REPLIES') > -1
  );
  const [canSend, setCandSend] = useState(true);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        if (canSend) {
          setCandSend(false);
          let result = await adapter.getAllDepths(false);
          setCandSend(true);
          if (!Number.isInteger(result)) {
            let _lastDepth = result.find(q => q.name === data.queueName)[
              'depth'
            ];
            _updateQueuedata(result);
            // Keep the store's depth map current so consumeMessageFromQueue
            // can make the right decision about whether to drain a plate.
            _setNodeDepth(id, _lastDepth);
            if (_lastDepth < prevDepthRef.current) {
              const outEdge = edges.find(e => e.source === id);
              if (outEdge) {
                _animateEdgeFromNode(outEdge.source, true);
                setTimeout(
                  () => _animateEdgeFromNode(outEdge.source, false),
                  1000
                );
              }
            }
            prevDepthRef.current = _lastDepth;
            setCurrentDepth(_lastDepth);
          } else if (result === 525) {
            // MQ manager not reachable
            toast.error('The queue manager is not reachable.');
          } else if (result === 505) {
            // Error on getting qdepth
            toast.error('The backend server is not reachable.');
          }
        }
      } catch (e) {
        console.log(e);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const handles = isTmpQueue ? (
    <>
      <Handle
        type="target"
        position="right"
        style={{ background: 'orange' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position="left"
        style={{ background: 'orange' }}
        isConnectable={isConnectable}
      />
    </>
  ) : (
    <>
      <Handle
        type="target"
        position="left"
        style={{ background: '#0050e6' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position="right"
        style={{ background: 'orange' }}
        isConnectable={isConnectable}
      />
    </>
  );

  const fillPct = Math.min((currentDepth / MAX_QUEUE_DEPTH) * 100, 100);
  const label = isTmpQueue ? 'Reply Queue' : 'Queue';

  return (
    <NodeCard
      headerBg={HEADER_BG}
      headerBorderColor={HEADER_BORDER}
      icon={<IbmMq size={20} />}
      iconColor="#ffffff"
      title={label}
      titleColor="#ffffff"
      onDelete={() => deleteMe(id, true)}
      className={isTmpQueue ? 'blob' : 'queue-node'}>
      {handles}
      <div className="queue-node__body">
        <QueueVisualizer
          depth={currentDepth}
          size={64}
          landCount={landCount}
          drainCount={drainCount}
        />

        <div className="queue-node__stats">
          <p className="queue-node__type-label">{label.toUpperCase()}</p>
          <p className="queue-node__name">{data.queueName}</p>
          <div className="queue-node__bar-wrap">
            <div className="queue-node__bar-track">
              <div
                className="queue-node__bar-fill"
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <p className="queue-node__depth">
              {currentDepth} / {MAX_QUEUE_DEPTH} msgs
            </p>
          </div>
        </div>
      </div>
      <div
        className="node-card__count-footer"
        style={{ margin: '0 -12px -12px', justifyContent: 'space-between' }}>
        <span>
          Max depth:&nbsp;<strong>{MAX_QUEUE_DEPTH}</strong>
        </span>
        <span className="queue-node__footer-status">
          <CheckmarkFilled size={14} className="queue-node__status-icon" />
          Active
        </span>
      </div>
    </NodeCard>
  );
};

export default memo(QueueNode);
