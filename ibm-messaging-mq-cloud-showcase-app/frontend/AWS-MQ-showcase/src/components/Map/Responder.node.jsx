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

import React, { useEffect, useState } from 'react';
import { Button, Toggle, TextInput } from '@carbon/react';
import { Send, CheckmarkFilled, SubtractAlt } from '@carbon/react/icons';
import { Handle } from '@xyflow/react';
import APIAdapter from '../../adapters/API.adapter';
import useStore from '../MQPatterns/RequestResponse/store';
import NodeCard from './NodeCard';
import AppIcon from './AppIcon';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

const HEADER_BG_ACTIVE = '#defbe6';
const HEADER_BORDER_ACTIVE = '#24a148';
const HEADER_BG_IDLE = '#f4f4f4';
const HEADER_BORDER_IDLE = '#c6c6c6';

const ResponderNode = ({ id, data }) => {
  const adapter = new APIAdapter();
  const _onClick = useStore(state => state.onClick);
  const deleteMe = useStore(state => state.onDeleteNode);
  const drainMessageFromQueue = useStore(state => state.drainMessageFromQueue);
  const _drawTmpConnection = useStore(state => state.drawTmpConnection);
  const _animateTmpConnection = useStore(state => state.animateTmpConnection);
  const _deleteTmpConnection = useStore(
    state => state.deleteEdgeFromConnection
  );
  const [name, setName] = useState(data.label);
  const [lastMessage, setLastMessage] = useState({});
  const [sessionCount, setSessionCount] = useState(0);
  const [getNext, setGetNext] = useState(true);
  const [responseMessage, setResponseMesasge] = useState('');
  const [replyQueue, setReplyQueue] = useState();
  const [defaultInitQueue, setDefaultInitQueue] = useState();
  const [sessionID, setSessionID] = useState();

  useEffect(() => {
    let _sessionID = Cookies.get('sessionID');
    id = _sessionID;
    setSessionID(_sessionID);
    setDefaultInitQueue(data.connectedQueue);
  }, []);

  useEffect(() => {
    if (data.isActive && defaultInitQueue) {
      const interval = setInterval(async () => {
        if (getNext) {
          try {
            setGetNext(false);
            let _lastMessages = await adapter.getDyn(
              1,
              defaultInitQueue,
              sessionID,
              'DYNREP'
            );
            setGetNext(true);
            if (_lastMessages) {
              drainMessageFromQueue(id);
              _onClick(id);
              setLastMessage(_lastMessages.message);
              let _replyQueue = _lastMessages.replyQueue;
              setReplyQueue(_replyQueue);
              if (_replyQueue) {
                _drawTmpConnection(_replyQueue, id, true);
                toast.success('Message received! It is time to reply!');
              }
              setSessionCount(state => state + 1);
            }
          } catch (e) {
            console.log(e);
          }
        }
      }, 1800);
      return () => clearInterval(interval);
    }
  });

  const changeResponseMessage = e => {
    setResponseMesasge(e.target.value);
  };

  const onSendResponse = () => {
    _animateTmpConnection(replyQueue, id);
    let _responseMessage = responseMessage;
    adapter
      .dynPut(_responseMessage, 1, replyQueue, 'DYNREP', id)
      .then(res => {
        _deleteTmpConnection(replyQueue, id);
        setReplyQueue('');
        setLastMessage('');
        setResponseMesasge('');
        toast.success('Your response has been sent!');
      })
      .catch(err => {
        toast.error('Error on sending your response.');
      });
  };

  const StatusIcon = data.isActive ? (
    <CheckmarkFilled size={14} className="queue-node__status-icon" />
  ) : (
    <SubtractAlt size={14} style={{ color: '#6f6f6f' }} />
  );

  const headerToggle = (
    <Toggle
      id={`responder-toggle-${id}`}
      size="sm"
      hideLabel
      labelA="Off"
      labelB="On"
      disabled={!defaultInitQueue}
      toggled={data.isActive}
      onToggle={() => _onClick(id)}
    />
  );

  return (
    <NodeCard
      headerBg={data.isActive ? HEADER_BG_ACTIVE : HEADER_BG_IDLE}
      headerBorderColor={
        data.isActive ? HEADER_BORDER_ACTIVE : HEADER_BORDER_IDLE
      }
      icon={<AppIcon size={20} />}
      title="Responder app"
      headerAction={headerToggle}
      onDelete={() => deleteMe(id)}
      className="responder-app">
      <Handle
        type="target"
        position="left"
        style={{
          zIndex: 200,
          backgroundColor: defaultInitQueue ? '#555' : 'orange',
        }}
        isConnectable={!defaultInitQueue}
      />
      <Handle
        type="source"
        position="left"
        style={{
          zIndex: 200,
          backgroundColor: defaultInitQueue ? '#555' : 'orange',
        }}
        isConnectable={!defaultInitQueue}
      />

      <TextInput
        id={`responder-name-${id}`}
        size="sm"
        labelText="Application name"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <div className="node-card__stats">
        <div className="node-card__stat-row">
          <span className="node-card__stat-label">Status</span>
          <span className="node-card__stat-value--with-icon">
            {StatusIcon}
            {data.isActive ? 'Listening' : 'Idle'}
          </span>
        </div>
        <div className="node-card__stat-row">
          <span className="node-card__stat-label">Transactions</span>
          <span className="node-card__stat-value">{sessionCount}</span>
        </div>
        <div className="node-card__stat-row">
          <span className="node-card__stat-label">Last message</span>
          <span className="node-card__stat-value">
            {lastMessage?.Message ?? '—'}
          </span>
        </div>
        <div className="node-card__stat-row">
          <span className="node-card__stat-label">Reply queue</span>
          <span className="node-card__stat-value">{replyQueue ?? '—'}</span>
        </div>
      </div>

      <hr className="node-card__divider" />

      <TextInput
        id={`responder-reply-${id}`}
        labelText="Reply message"
        placeholder="Write your response here"
        value={responseMessage}
        size="sm"
        onChange={e => changeResponseMessage(e)}
      />

      <Button
        renderIcon={props => <Send size={20} {...props} />}
        size="sm"
        kind="primary"
        style={{ width: '100%' }}
        disabled={!replyQueue}
        onClick={onSendResponse}>
        Send reply
      </Button>
    </NodeCard>
  );
};

export default ResponderNode;
