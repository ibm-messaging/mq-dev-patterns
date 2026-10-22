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
import {
  Button,
  Dropdown,
  Toggle,
  NumberInput,
  TextInput,
} from '@carbon/react';
import { Handle } from '@xyflow/react';
import { Send } from '@carbon/react/icons';
import APIAdapter from '../../adapters/API.adapter';
import useStore from '../MQPatterns/PointToPoint/store';
import NodeCard from './NodeCard';
import AppIcon from './AppIcon';
import { SHOWCASE_APP_CONSTANTS } from './utils';

const {
  CURRENCY_ITEMS,
  HEADER_BG_BLUE: HEADER_BG,
  HEADER_BORDER_BLUE: HEADER_BORDER,
} = SHOWCASE_APP_CONSTANTS;

const PRODUCTION_QUANTITY = 5;
const RANDOM_SENDER_NAMES = [
  'Alice Johnson',
  'Bob Martinez',
  'Carol Smith',
  'David Lee',
  'Emma Wilson',
  'Frank Brown',
  'Grace Taylor',
  'Henry Davis',
];
const randomSenderName = () =>
  RANDOM_SENDER_NAMES[Math.floor(Math.random() * RANDOM_SENDER_NAMES.length)];
const ProducerNode = ({ id, data }) => {
  const adapter = new APIAdapter();
  const animateConnection = useStore(
    (state) => state.changeEdgeAnimationFromNodeId
  );
  const sendMessages = useStore((state) => state.sendMessages);
  const deleteMe = useStore((state) => state.onDeleteNode);

  const [quantity, setQuantity] = useState(PRODUCTION_QUANTITY);
  const [animationState, setAnimationState] = useState(false);
  const [name, setName] = useState(
    process.env.REACT_APP_IS_FOR_CODING_CHALLENGE === 'true'
      ? randomSenderName()
      : data.label
  );
  const [isToggle, setIsToggle] = useState(false);
  const [totalSent, setTotalSent] = useState(0);

  const isForTheCodingChallange =
    process.env.REACT_APP_IS_FOR_CODING_CHALLENGE === 'true';
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');

  useEffect(() => {
    if (animationState) {
      const t = setTimeout(() => {
        animateConnection(id, false);
        setAnimationState(false);
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [animationState]);

  useEffect(() => {
    if (data.connectedQueue && isToggle) {
      const interval = setInterval(() => {
        _onClick(id);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [data.connectedQueue, isToggle]);

  const _onClick = (id) => {
    setAnimationState(true);
    animateConnection(id, true);
    try {
      if (isForTheCodingChallange) {
        adapter
          .put(quantity, 1, data.connectedQueue, selectedCurrency)
          .then(() => {
            sendMessages(id, 1);
            setTotalSent((prev) => prev + 1);
            if (isToggle) adapter.closeProducer();
          });
      } else {
        let message = 'You bought a new ticket!';
        adapter.put(message, quantity, data.connectedQueue).then(() => {
          sendMessages(id, quantity);
          setTotalSent((prev) => prev + quantity);
          if (isToggle) adapter.closeProducer();
        });
      }
    } catch (e) {
      console.log(e);
      setAnimationState(false);
    }
  };

  useEffect(() => {
    if (!data.connectedQueue) {
      adapter.closeProducer();
    }
  }, [data.connectedQueue]);

  const handle = (
    <Handle
      type="source"
      position="right"
      style={{
        zIndex: 200,
        backgroundColor: data.connectedQueue ? '#555' : '#0050e6',
      }}
      isConnectable={!data.connectedQueue}
    />
  );

  if (isForTheCodingChallange) {
    return (
      <NodeCard
        headerBg={HEADER_BG}
        headerBorderColor={HEADER_BORDER}
        icon={<AppIcon size={20} />}
        title="Producer app"
        onDelete={() => {
          deleteMe(id);
          adapter.closeProducer();
        }}>
        {handle}

        <TextInput
          id={`producer-name-${id}`}
          size="sm"
          labelText="Name of your sender"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="producer-node__amount-row">
          <div className="producer-node__amount-row__amount">
            <NumberInput
              id={`producer-quantity-${id}`}
              invalidText="Number is not valid"
              helperText="Amount"
              min={1}
              step={1}
              value={quantity}
              onChange={(_e, { value }) => setQuantity(value)}
            />
          </div>
          <div className="producer-node__amount-row__currency">
            <Dropdown
              id={`producer-currency-${id}`}
              className="nodrag"
              items={CURRENCY_ITEMS}
              itemToString={(item) => (item ? item.text : '')}
              selectedItem={
                CURRENCY_ITEMS.find((c) => c.text === selectedCurrency) ?? null
              }
              onChange={({ selectedItem }) =>
                setSelectedCurrency(selectedItem.text)
              }
              helperText="Currency"
            />
          </div>
        </div>

        <Button
          className="producer-node__send-button"
          renderIcon={(props) => <Send size={20} {...props} />}
          size="lg"
          kind="primary"
          isExpressive
          disabled={!data.connectedQueue || animationState || quantity <= 0}
          onClick={() => _onClick(id)}>
          Send cash
        </Button>

        <p className="node-card__stat-line">
          Total sent: <strong>{totalSent}</strong>
        </p>
      </NodeCard>
    );
  }

  return (
    <NodeCard
      headerBg={HEADER_BG}
      headerBorderColor={HEADER_BORDER}
      icon={<AppIcon size={20} />}
      title="Producer app"
      onDelete={() => deleteMe(id)}>
      {handle}

      <TextInput
        id={`producer-name-${id}`}
        size="sm"
        labelText="Application name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <NumberInput
        id={`producer-tickets-${id}`}
        invalidText="Number is not valid"
        label="Quantity per request"
        max={100}
        min={1}
        step={1}
        value={quantity}
        onChange={(_e, { value }) => setQuantity(value)}
      />

      <Button
        renderIcon={(props) => <Send size={20} {...props} />}
        size="lg"
        kind="primary"
        style={{ width: '100%' }}
        disabled={!data.connectedQueue || animationState || quantity <= 0}
        onClick={() => _onClick(id)}>
        Create booking
      </Button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#525252' }}>Auto send</span>
        <Toggle
          id={`producer-toggle-${id}`}
          size="sm"
          hideLabel
          toggled={isToggle}
          onToggle={() => setIsToggle(!isToggle)}
        />
        <span style={{ fontSize: '11px', color: '#161616' }}>
          {isToggle ? 'On' : 'Off'}
        </span>
      </div>

      <p className="node-card__stat-line">
        Total sent: <strong>{totalSent}</strong>
      </p>
    </NodeCard>
  );
};

export default memo(ProducerNode);
