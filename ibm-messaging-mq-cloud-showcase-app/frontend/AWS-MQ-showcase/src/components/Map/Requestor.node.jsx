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

import React, { useEffect, memo, useState } from 'react';
import { Button, NumberInput, TextInput } from '@carbon/react';
import { Handle } from '@xyflow/react';
import APIAdapter from '../../adapters/API.adapter';
import useStore from '../MQPatterns/RequestResponse/store';
import NodeCard from './NodeCard';
import AppIcon from './AppIcon';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

// Figma spec: blue accent header — same as Producer
const HEADER_BG = '#e8f3ff';
const HEADER_BORDER = '#0f62fe';

const RequestorNode = ({ id, data }) => {
  const adapter = new APIAdapter();
  const animateConnection = useStore(
    state => state.changeEdgeAnimationFromNodeId
  );
  const sendMessages = useStore(state => state.sendMessages);
  const deleteMe = useStore(state => state.onDeleteNode);
  const _drawTmpQueue = useStore(state => state.creteTmpQueue);
  const _drawTmpConnection = useStore(state => state.drawTmpConnection);
  const _deleteTmpQueue = useStore(
    state => state.deleteTmpQueueFromTmpQueueName
  );
  const [name, setName] = useState(data.label);
  const [quantity, setQuantity] = useState(1);
  const [animationState, setAnimationState] = useState(false);
  const [tmpQueueName, setTmpQueueName] = useState();
  const [isWaitingForReply, setIsWaitingForReply] = useState(false);
  const [responseMessage, setResponseMessage] = useState();
  const [sessionID, setSessionID] = useState();

  useEffect(() => {
    let _sessionID = Cookies.get('sessionID');
    setSessionID(_sessionID);

    if (animationState) {
      setTimeout(() => {
        animateConnection(id, false);
        setAnimationState(false);
      }, 1000);
    }
  });

  useEffect(() => {
    if (isWaitingForReply) {
      const interval = setInterval(async () => {
        try {
          adapter.getDyn(1, tmpQueueName, id, 'DYNPUT').then(message => {
            if (message) {
              setResponseMessage(message);
              setIsWaitingForReply(false);
              // close the connection
              _deleteTmpQueue(tmpQueueName);
              setTmpQueueName(null);
              toast.success('Response received successfully!');
            }
          });
        } catch (err) {
          console.log('Error');
        }
      }, 2500);
      return () => clearInterval(interval);
    }
  });

  const _onClick = id => {
    setAnimationState(true);
    animateConnection(id, true);
    sendMessages(id, quantity);
    try {
      let message = 'Request';
      adapter
        .dynPut(message, 1, data.connectedQueue, 'DYNPUT', id, sessionID)
        .then(res => {
          //Drow the TMP queue && starting pulling the TMP queue waiting for the response
          if (res !== -1) {
            toast.success('The request has been sent!');
            let tmpQueueName = res._name;
            setTmpQueueName(tmpQueueName);
            setIsWaitingForReply(true);
            _drawTmpQueue(tmpQueueName, id);
            _drawTmpConnection(data.connectedQueue, id, false);
          }
        });
    } catch (e) {
      console.log(e);
      setAnimationState(false);
    }
  };

  const handleOnChange = (e, value) => {
    var delta = value.direction === 'up' ? 1 : -1;
    setQuantity(quantity + delta);
  };

  return (
    <NodeCard
      headerBg={HEADER_BG}
      headerBorderColor={HEADER_BORDER}
      icon={<AppIcon size={20} />}
      title="Requestor app"
      onDelete={() => deleteMe(id)}>
      <Handle
        type="source"
        position="right"
        style={{
          zIndex: 200,
          backgroundColor: data.connectedQueue ? '#555' : '#0050e6',
        }}
        isConnectable={!data.connectedQueue}
      />
      <Handle
        type="target"
        position="right"
        style={{
          zIndex: 200,
          backgroundColor: data.connectedQueue ? '#555' : '#0050e6',
        }}
        isConnectable={!data.connectedQueue}
      />

      <TextInput
        id={`requestor-name-${id}`}
        size="sm"
        labelText="Name of your application"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <NumberInput
        id={`requestor-quantity-${id}`}
        invalidText="Number is not valid"
        label="Request quantity"
        max={100}
        min={1}
        step={10}
        value={quantity}
        onChange={handleOnChange}
      />

      <Button
        size="sm"
        kind="primary"
        style={{ width: '100%' }}
        disabled={isWaitingForReply || !data.connectedQueue}
        onClick={() => _onClick(id)}>
        {isWaitingForReply ? 'Waiting for reply…' : 'Submit request'}
      </Button>

      {responseMessage && (
        <p className="node-card__stat-line">
          Response: <strong>{responseMessage}</strong>
        </p>
      )}
    </NodeCard>
  );
};

export default memo(RequestorNode);
