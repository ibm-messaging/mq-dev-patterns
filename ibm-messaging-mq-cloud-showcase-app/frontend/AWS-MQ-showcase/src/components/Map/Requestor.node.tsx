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

import { useEffect, memo, useState } from 'react';
import { Button, NumberInput, TextInput } from '@carbon/react';
import { Send } from '@carbon/react/icons';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import APIAdapter from '../../adapters/API.adapter';
import useStore from '../MQPatterns/RequestResponse/store';
import NodeCard from './NodeCard';
import AppIcon from './AppIcon';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { NODE_HEADER_COLORS, HANDLE_COLORS } from '../../utils/colors';
import type { ProducerFlowNode } from '../../types';

const { HEADER_BG_BLUE: HEADER_BG, HEADER_BORDER_BLUE: HEADER_BORDER } =
  NODE_HEADER_COLORS;

const RequestorNode = ({ id, data }: NodeProps<ProducerFlowNode>) => {
  const adapter = new APIAdapter();
  const animateConnection = useStore(
    (state) => state.changeEdgeAnimationFromNodeId
  );
  const sendMessages = useStore((state) => state.sendMessages);
  const deleteMe = useStore((state) => state.onDeleteNode);
  const _drawTmpQueue = useStore((state) => state.creteTmpQueue);
  const _drawTmpConnection = useStore((state) => state.drawTmpConnection);
  const _deleteTmpQueue = useStore(
    (state) => state.deleteTmpQueueFromTmpQueueName
  );

  const [name, setName] = useState(data.label);
  const [quantity, setQuantity] = useState(1);
  const [animationState, setAnimationState] = useState(false);
  const [tmpQueueName, setTmpQueueName] = useState<string | null>(null);
  const [isWaitingForReply, setIsWaitingForReply] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | undefined>(
    undefined
  );
  const [sessionID, setSessionID] = useState<string | undefined>(undefined);

  useEffect(() => {
    const _sessionID = Cookies.get('sessionID');
    setSessionID(_sessionID);

    if (animationState) {
      const t = setTimeout(() => {
        animateConnection(id, false);
        setAnimationState(false);
      }, 1000);
      return () => clearTimeout(t);
    }
  });

  useEffect(() => {
    if (isWaitingForReply) {
      const interval = setInterval(() => {
        adapter.getDyn(1, tmpQueueName!, id, 'DYNPUT').then((message) => {
          if (message) {
            setResponseMessage(String(message));
            setIsWaitingForReply(false);
            _deleteTmpQueue(tmpQueueName!);
            setTmpQueueName(null);
            toast.success('Response received successfully!');
          }
        });
      }, 2500);
      return () => clearInterval(interval);
    }
  });

  const _onClick = (nodeId: string) => {
    setAnimationState(true);
    animateConnection(nodeId, true);
    sendMessages(nodeId, 1);
    adapter
      .dynPut(
        'Request',
        1,
        data.connectedQueue,
        'DYNPUT',
        nodeId,
        sessionID ?? null
      )
      .then((res) => {
        if (res !== -1 && res !== undefined) {
          toast.success('The request has been sent!');
          const name = res._name;
          setTmpQueueName(name);
          setIsWaitingForReply(true);
          _drawTmpQueue(name, nodeId);
          _drawTmpConnection(data.connectedQueue, nodeId, false);
        }
      });
  };

  const handleOnChange = (
    _e: unknown,
    value: { value: string | number; direction: string }
  ) => {
    const delta = value.direction === 'up' ? 1 : -1;
    setQuantity((q) => q + delta);
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
        position={Position.Right}
        style={{
          zIndex: 200,
          backgroundColor: data.connectedQueue
            ? HANDLE_COLORS.CONNECTED
            : HANDLE_COLORS.PRODUCER_IDLE,
        }}
        isConnectable={!data.connectedQueue}
      />
      <Handle
        type="target"
        position={Position.Right}
        style={{
          zIndex: 200,
          backgroundColor: data.connectedQueue
            ? HANDLE_COLORS.CONNECTED
            : HANDLE_COLORS.PRODUCER_IDLE,
        }}
        isConnectable={!data.connectedQueue}
      />

      <TextInput
        id={`requestor-name-${id}`}
        size="sm"
        labelText="Name of your application"
        value={name}
        onChange={(e) => setName(e.target.value)}
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
        renderIcon={(props) => <Send size={20} {...props} />}
        size="lg"
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
