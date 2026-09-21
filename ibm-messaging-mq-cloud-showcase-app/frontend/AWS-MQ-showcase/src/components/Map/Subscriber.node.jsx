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

import React, { useEffect, useRef, useState } from 'react';
import { Handle } from '@xyflow/react';
import { TextInput } from '@carbon/react';
import APIAdapter from '../../adapters/API.adapter';
import useStore from '../MQPatterns/PubSub/store';
import NodeCard from './NodeCard';
import AppIcon from './AppIcon';
import { toast } from 'react-toastify';

const HEADER_BG = '#defbe6';
const HEADER_BORDER = '#24a148';
const HEADER_BG_SUBSCRIBED = '#a7f0ba';

const SubscriberNode = ({ id, data }) => {
  const adapter = new APIAdapter();
  const animateConnection = useStore(
    state => state.changeEdgeAnimationFromNodeId
  );
  const subscriberReceived = useStore(state => state.subscriberReceived);
  const _deleteMe = useStore(state => state.onDeleteNode);
  const _deleteEdgeDueToFailingSub = useStore(
    state => state.deleteEdgeFromNode
  );

  const [lastMessage, setLastMessage] = useState(undefined);
  const [sessionCount, setSessionCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [canSend, setCandSend] = useState(true);
  const [animationState, setAnimationState] = useState(false);
  const nameRef = useRef(null);

  const intervalTillTheLastMessage = between(1500, 3500);

  function between(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  useEffect(() => {
    if (data.connectedQueue && isSubscribed) {
      const interval = setInterval(async () => {
        try {
          if (canSend) {
            setCandSend(false);
            let _lastMessages = await adapter.getForSubFromAppId(
              id,
              data.connectedQueue
            );
            setCandSend(true);

            if (_lastMessages !== undefined) {
              if (_lastMessages === -1) {
                setIsSubscribed(true);
                toast.success('Success on subscription');
              } else {
                setAnimationState(true);
                animateConnection(id, true);
                subscriberReceived(id);
                setLastMessage(_lastMessages);
                setSessionCount(state => state + 1);
              }
            }
          }
        } catch (e) {
          console.log(e);
        }
      }, intervalTillTheLastMessage);
      return () => clearInterval(interval);
    }
  });

  useEffect(() => {
    if (animationState) {
      setTimeout(() => {
        animateConnection(id, false);
        setAnimationState(false);
      }, 1000);
    }
  }, [animationState]);

  useEffect(() => {
    if (data.connectedQueue && data.subscriptionState !== 2) {
      subscribe();
    } else if (!data.connectedQueue || data.subscriptionState === 2) {
      if (isSubscribed) unsub();
      else setIsSubscribed(false);
    }
  }, [data.connectedQueue, data.subscriptionState]); // eslint-disable-line react-hooks/exhaustive-deps

  const unsub = () => {
    let promise = new Promise((resolve, reject) => {
      adapter
        .unsubscribe(id)
        .then(() => {
          resolve();
          setIsSubscribed(false);
        })
        .catch(err => {
          reject();
          setIsSubscribed(false);
        });
    });
    toast.promise(promise, {
      pending: 'Waiting for unsubscribing',
      success: 'Success on unsubscribing',
      error: 'Error on unsubscribing',
    });
  };

  const subscribe = () => {
    let prom = new Promise((resolve, reject) => {
      adapter
        .subscribe(id, data.connectedQueue)
        .then(() => {
          resolve();
          setIsSubscribed(true);
        })
        .catch(err => {
          reject();
          _deleteEdgeDueToFailingSub(id);
          setIsSubscribed(false);
        });
    });
    toast.promise(prom, {
      pending: 'Waiting for subscription',
      success: 'Success on subscribing',
      error: 'Error on subscribing',
    });
  };

  const deleteMe = () => {
    unsub();
    _deleteMe(id);
  };

  return (
    <NodeCard
      headerBg={isSubscribed ? HEADER_BG_SUBSCRIBED : HEADER_BG}
      headerBorderColor={HEADER_BORDER}
      icon={<AppIcon size={20} />}
      title="Subscriber"
      titleColor="#161616"
      onDelete={deleteMe}>
      <Handle
        type="target"
        position="left"
        style={{
          zIndex: 200,
          backgroundColor: data.connectedQueue ? '#555' : 'orange',
        }}
        isConnectable={!data.connectedQueue}
      />

      {/* Name field */}
      <TextInput
        ref={nameRef}
        id={`subscriber-name-${id}`}
        size="sm"
        labelText="Name"
        defaultValue={data.label || 'Subscriber'}
      />

      <span className="node-card__section-label">
        Last notification received
      </span>

      <div className="node-card__msg-grid">
        <span className="node-card__msg-label">Title</span>
        <span className="node-card__msg-value">
          {lastMessage?.Title ?? '—'}
        </span>

        <span className="node-card__msg-label">Message</span>
        <span className="node-card__msg-value">
          {lastMessage?.Message ?? '—'}
        </span>

        <span className="node-card__msg-label">Date</span>
        <span className="node-card__msg-value">{lastMessage?.Date ?? '—'}</span>
      </div>

      <div>
        {isSubscribed && data.connectedQueue ? (
          <span className="node-card__sub-badge">
            Subscribed to: {data.connectedQueue}
          </span>
        ) : (
          <span className="node-card__sub-badge node-card__sub-badge--empty">
            —
          </span>
        )}
      </div>

      <div
        className="node-card__count-footer"
        style={{ margin: '0 -12px -12px' }}>
        Notifications received:&nbsp;<strong>{sessionCount}</strong>
      </div>
    </NodeCard>
  );
};

export default SubscriberNode;
