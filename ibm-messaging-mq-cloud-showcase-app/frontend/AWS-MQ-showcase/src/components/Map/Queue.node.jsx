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

import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import { Handle } from '@xyflow/react';
import { Popover, PopoverContent } from '@carbon/react';
import {
  CheckmarkFilled,
  Close,
  IbmMq,
  Information,
} from '@carbon/react/icons';
import APIAdapter from '../../adapters/API.adapter';
import useP2PStore from '../MQPatterns/PointToPoint/store';
import useRRStore from '../MQPatterns/RequestResponse/store';
import NodeCard from './NodeCard';
import QueueVisualizer from './QueueVisualizer';
import { toast } from 'react-toastify';

const FALLBACK_MAX_DEPTH = 5000;
const HEADER_BG = '#161616';
const HEADER_BORDER = '#161616';

function useQueueStore(id) {
  const p2pHasNode = useP2PStore(state => state.nodes.some(n => n.id === id));

  const p2pUpdateQueueData = useP2PStore(state => state.updateQueueData);
  const p2pSetNodeDepth = useP2PStore(state => state.setNodeDepth);
  const p2pDeleteMe = useP2PStore(state => state.onDeleteNode);
  const p2pAnimateEdge = useP2PStore(
    state => state.changeEdgeAnimationFromNodeId
  );
  const p2pEdges = useP2PStore(state => state.edges);
  const p2pLocalDepth = useP2PStore(state => state.localDepths?.[id]);

  const rrUpdateQueueData = useRRStore(state => state.updateQueueData);
  const rrSetNodeDepth = useRRStore(state => state.setNodeDepth);
  const rrDeleteMe = useRRStore(state => state.onDeleteNode);
  const rrAnimateEdge = useRRStore(
    state => state.changeEdgeAnimationFromNodeId
  );
  const rrEdges = useRRStore(state => state.edges);
  const rrLocalDepth = useRRStore(state => state.localDepths?.[id]);

  return p2pHasNode
    ? {
        updateQueueData: p2pUpdateQueueData,
        setNodeDepth: p2pSetNodeDepth,
        deleteMe: p2pDeleteMe,
        animateEdge: p2pAnimateEdge,
        edges: p2pEdges,
        localDepth: p2pLocalDepth,
      }
    : {
        updateQueueData: rrUpdateQueueData,
        setNodeDepth: rrSetNodeDepth,
        deleteMe: rrDeleteMe,
        animateEdge: rrAnimateEdge,
        edges: rrEdges,
        localDepth: rrLocalDepth,
      };
}

const QueueNode = ({ id, data, isConnectable }) => {
  const adapter = useRef(new APIAdapter()).current;

  const {
    updateQueueData,
    setNodeDepth,
    deleteMe,
    animateEdge,
    edges,
    localDepth,
  } = useQueueStore(id);

  const [currentDepth, setCurrentDepth] = useState(0);
  const [maxDepth, setMaxDepth] = useState(FALLBACK_MAX_DEPTH);
  const displayDepth = localDepth !== undefined ? localDepth : currentDepth;
  const prevDepthRef = useRef(0);
  const [landCount, setLandCount] = useState(0);
  const [drainCount, setDrainCount] = useState(0);
  const seenLandRef = useRef(0);
  const seenDrainRef = useRef(0);

  const storeRef = useRef({});
  storeRef.current.updateQueueData = updateQueueData;
  storeRef.current.setNodeDepth = setNodeDepth;
  storeRef.current.animateEdge = animateEdge;
  storeRef.current.edges = edges;

  const [everLanded, setEverLanded] = useState(() => (data.landCount || 0) > 0);
  const [infoOpen, setInfoOpen] = useState(false);
  const userDismissedRef = useRef(false);

  useEffect(() => {
    const delta = (data.landCount || 0) - seenLandRef.current;
    if (delta > 0) {
      seenLandRef.current += delta;
      setLandCount(prev => prev + delta);
      setEverLanded(true);
      if (!userDismissedRef.current) {
        setInfoOpen(true);
      }
    }
  }, [data.landCount]);

  useEffect(() => {
    const delta = (data.drainCount || 0) - seenDrainRef.current;
    if (delta > 0) {
      seenDrainRef.current += delta;
      setDrainCount(prev => prev + delta);
      setInfoOpen(false);
      setEverLanded(false);
      userDismissedRef.current = false;
    }
  }, [data.drainCount]);

  const isTmpQueue =
    !!data.isReplyQueue || data.queueName.includes('APP.REPLIES');

  useEffect(() => {
    if (displayDepth === 0 && everLanded) {
      setInfoOpen(false);
      setEverLanded(false);
      userDismissedRef.current = false;
    }
  }, [displayDepth, everLanded]);

  const handleInfoToggle = useCallback(() => {
    setInfoOpen(prev => {
      if (prev) userDismissedRef.current = true;
      else userDismissedRef.current = false;
      return !prev;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const result = await adapter.getAllDepths(false);
        if (!cancelled) {
          if (!Number.isInteger(result)) {
            const queueEntry = result.find(q => q.name === data.queueName);
            const _lastDepth = queueEntry['depth'];
            if (queueEntry['maxDepth'] != null) {
              setMaxDepth(queueEntry['maxDepth']);
            }
            storeRef.current.updateQueueData(result);
            storeRef.current.setNodeDepth(id, _lastDepth);
            if (_lastDepth < prevDepthRef.current) {
              const outEdge = storeRef.current.edges.find(e => e.source === id);
              if (outEdge) {
                storeRef.current.animateEdge(outEdge.source, true);
                setTimeout(
                  () => storeRef.current.animateEdge(outEdge.source, false),
                  1000
                );
              }
            }
            prevDepthRef.current = _lastDepth;
            setCurrentDepth(_lastDepth);
          } else if (result === 525) {
            toast.error('The queue manager is not reachable.');
          } else if (result === 505) {
            toast.error('The backend server is not reachable.');
          }
        }
      } catch (e) {
        console.log(e);
      }
      if (!cancelled) setTimeout(poll, 3000);
    };

    setTimeout(poll, 3000);
    return () => {
      cancelled = true;
    };
  }, [adapter, id, data.queueName]);

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

  const fillPct = Math.min((displayDepth / maxDepth) * 100, 100);
  const label = isTmpQueue ? 'Reply Queue' : 'Queue';
  const hasMessages = everLanded || displayDepth > 0;

  const infoAction = hasMessages ? (
    <Popover
      open={infoOpen}
      align="top"
      highContrast
      onRequestClose={() => {
        userDismissedRef.current = true;
        setInfoOpen(false);
      }}
      className="queue-node__info-popover">
      <button
        className="queue-node__info-btn"
        aria-label="Messages waiting in queue"
        aria-expanded={infoOpen}
        onClick={handleInfoToggle}>
        <Information size={18} />
      </button>
      <PopoverContent className="queue-node__info-popover-content">
        <div className="queue-node__info-popover-header">
          <p className="queue-node__info-title">Messages waiting in queue</p>
          <button
            className="queue-node__info-close"
            aria-label="Close"
            onClick={() => {
              userDismissedRef.current = true;
              setInfoOpen(false);
            }}>
            <Close size={16} />
          </button>
        </div>
        <p className="queue-node__info-body">
          There {(displayDepth || landCount) !== 1 ? 'are' : 'is'}{' '}
          <strong>{displayDepth || landCount}</strong> message
          {(displayDepth || landCount) !== 1 ? 's' : ''} waiting in{' '}
          <strong>{data.queueName}</strong>. Messages persist on the queue
          manager until a consuming application receives them — you can browse
          them in the IBM MQ Console if you are logged in.
        </p>
      </PopoverContent>
    </Popover>
  ) : null;

  return (
    <NodeCard
      headerBg={HEADER_BG}
      headerBorderColor={HEADER_BORDER}
      icon={<IbmMq size={20} />}
      iconColor="#ffffff"
      title={label}
      titleColor="#ffffff"
      headerAction={infoAction}
      onDelete={() => deleteMe(id, true)}
      className={isTmpQueue ? 'blob' : 'queue-node'}>
      {handles}
      <div className="queue-node__body">
        <QueueVisualizer
          depth={currentDepth}
          vizDepth={displayDepth}
          size={64}
          landCount={landCount}
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
              {displayDepth} / {maxDepth} msgs
            </p>
          </div>
        </div>
      </div>
      <div
        className="node-card__count-footer"
        style={{ margin: '0 -12px -12px', justifyContent: 'space-between' }}>
        <span>
          Max depth:&nbsp;<strong>{maxDepth}</strong>
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
