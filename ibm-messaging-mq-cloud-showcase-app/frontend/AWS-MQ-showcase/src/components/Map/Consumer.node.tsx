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

import { useEffect, useState } from 'react';
import { Toggle, Dropdown } from '@carbon/react';
import { CheckmarkFilled, SubtractAlt } from '@carbon/react/icons';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { gray60 } from '@carbon/colors';
import APIAdapter from '../../adapters/API.adapter';
import useStore from '../MQPatterns/PointToPoint/store';
import NodeCard from './NodeCard';
import AppIcon from './AppIcon';
import { CURRENCY_ITEMS } from './utils';
import { NODE_HEADER_COLORS, HANDLE_COLORS } from '../../utils/colors';
import type {
  CodingChallengeResult,
  ConsumerFlowNode,
  MQMessage,
} from '../../types';

const {
  HEADER_BG_ACTIVE,
  HEADER_BORDER_ACTIVE,
  HEADER_BG_IDLE,
  HEADER_BORDER_IDLE,
} = NODE_HEADER_COLORS;

const ConsumerNode = ({ id, data }: NodeProps<ConsumerFlowNode>) => {
  const adapter = new APIAdapter();
  const _onClick = useStore((state) => state.onClick);
  const deleteMe = useStore((state) => state.onDeleteNode);
  const animateConnection = useStore(
    (state) => state.changeEdgeAnimationFromNodeId
  );
  const consumeMessageFromQueue = useStore(
    (state) => state.consumeMessageFromQueue
  );

  const [lastMessage, setLastMessage] = useState<
    MQMessage | CodingChallengeResult
  >();
  const [sessionCount, setSessionCount] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');

  const isForTheCodingChallange =
    process.env.REACT_APP_IS_FOR_CODING_CHALLENGE === 'true';

  useEffect(() => {
    if (data.isActive && data.connectedQueue) {
      const interval = setInterval(async () => {
        try {
          let _lastMessages: MQMessage | CodingChallengeResult | undefined;
          if (isForTheCodingChallange) {
            _lastMessages = await adapter.getFromLimitCodingChallange(
              1,
              data.connectedQueue,
              selectedCurrency,
              id
            );
          } else {
            _lastMessages = await adapter.getFromLimit(1, data.connectedQueue);
          }
          setLastMessage(_lastMessages);
          if (_lastMessages) {
            animateConnection(id, true);
            consumeMessageFromQueue(id);
            setSessionCount((state) => state + 1);
          }
        } catch (e) {
          console.log(e);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [data.isActive, data.connectedQueue, selectedCurrency]);

  // Each build only ever holds one of the two.
  const challengeResult =
    lastMessage && 'currency' in lastMessage ? lastMessage : undefined;
  const mqMessage =
    lastMessage && 'Message' in lastMessage ? lastMessage : undefined;

  const handle = (
    <Handle
      type="target"
      position={Position.Left}
      style={{
        zIndex: 200,
        backgroundColor: data.connectedQueue
          ? HANDLE_COLORS.CONNECTED
          : HANDLE_COLORS.CONSUMER_IDLE,
      }}
      isConnectable={!data.connectedQueue}
    />
  );

  const StatusIcon = data.isActive ? (
    <CheckmarkFilled size={14} className="queue-node__status-icon" />
  ) : (
    <SubtractAlt size={14} style={{ color: gray60 }} />
  );

  const headerToggle = (
    <Toggle
      id={`consumer-toggle-${id}`}
      size="sm"
      hideLabel
      labelA="Off"
      labelB="On"
      disabled={!data.connectedQueue}
      toggled={data.isActive}
      onToggle={() => _onClick(id)}
    />
  );

  if (isForTheCodingChallange) {
    return (
      <NodeCard
        headerBg={data.isActive ? HEADER_BG_ACTIVE : HEADER_BG_IDLE}
        headerBorderColor={
          data.isActive ? HEADER_BORDER_ACTIVE : HEADER_BORDER_IDLE
        }
        icon={<AppIcon size={20} />}
        title="Consumer app"
        headerAction={headerToggle}
        className={data.isActive ? 'blob' : ''}
        onDelete={() => deleteMe(id)}>
        {handle}

        <Dropdown
          id={`consumer-currency-${id}`}
          className="nodrag"
          items={CURRENCY_ITEMS}
          itemToString={(item) => (item ? item.text : '')}
          selectedItem={
            CURRENCY_ITEMS.find((c) => c.text === selectedCurrency) ?? null
          }
          onChange={({ selectedItem }) => {
            if (selectedItem) setSelectedCurrency(selectedItem.text);
          }}
          helperText={'Filtering by ' + selectedCurrency}
          label="Currency"
          titleText=""
        />

        <div className="node-card__stats">
          <div className="node-card__stat-row">
            <span className="node-card__stat-label">Status: </span>
            <span className="node-card__stat-value--with-icon">
              {StatusIcon}
              {data.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="node-card__stat-row">
            <span className="node-card__stat-label">Received</span>
            <span className="node-card__stat-value">{sessionCount}</span>
          </div>
          <div className="node-card__stat-row">
            <span className="node-card__stat-label">Amount</span>
            <span className="node-card__stat-value">
              {challengeResult?.message.Message ?? '—'}
            </span>
          </div>
          <div className="node-card__stat-row">
            <span className="node-card__stat-label">Currency</span>
            <span className="node-card__stat-value">
              {challengeResult?.currency ?? '—'}
            </span>
          </div>
          <div className="node-card__stat-row">
            <span className="node-card__stat-label">Date</span>
            <span className="node-card__stat-value">
              {challengeResult?.message.Sent?.substring(0, 10) ?? '—'}
            </span>
          </div>
          <span className="node-card__stat-label">Count</span>
          <div className="node-card__stat-row">
            <span className="node-card__stat-value">
              {challengeResult?.message.count ?? '—'}
            </span>
          </div>
        </div>
      </NodeCard>
    );
  }

  return (
    <NodeCard
      headerBg={data.isActive ? HEADER_BG_ACTIVE : HEADER_BG_IDLE}
      headerBorderColor={
        data.isActive ? HEADER_BORDER_ACTIVE : HEADER_BORDER_IDLE
      }
      icon={<AppIcon size={20} />}
      title="Consumer app"
      headerAction={headerToggle}
      className={data.isActive ? 'blob' : ''}
      onDelete={() => {
        deleteMe(id);
        adapter.closeConsumer(id);
      }}>
      {handle}

      <div className="node-card__stats">
        <div className="node-card__stat-row">
          <span className="node-card__stat-label">Status</span>
          <span className="node-card__stat-value--with-icon">
            {StatusIcon}
            {data.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="node-card__stat-row">
          <span className="node-card__stat-label">Received</span>
          <span className="node-card__stat-value">{sessionCount}</span>
        </div>
        <div className="node-card__stat-row">
          <span className="node-card__stat-label">Type</span>
          <span className="node-card__stat-value">
            {mqMessage?.Message ?? '—'}
          </span>
        </div>
        <div className="node-card__stat-row">
          <span className="node-card__stat-label">Date</span>
          <span className="node-card__stat-value">
            {mqMessage?.Sent?.substring(0, 10) ?? '—'}
          </span>
        </div>
      </div>

      <p className="node-card__stat-line">
        Counter: <strong>{mqMessage?.Count ?? 0}</strong>
      </p>

      {!data.isActive && (
        <p className="node-card__toggle-hint">Toggle on to start receiving</p>
      )}
    </NodeCard>
  );
};

export default ConsumerNode;
