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
  Column,
  Dropdown,
  Grid,
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

const PRODUCTION_QUANTITY = 5;
const HEADER_BG = '#e8f3ff';
const HEADER_BORDER = '#0f62fe';

const ProducerNode = ({ id, data }) => {
  const adapter = new APIAdapter();
  const animateConnection = useStore(
    state => state.changeEdgeAnimationFromNodeId
  );
  const sendMessages = useStore(state => state.sendMessages);
  const deleteMe = useStore(state => state.onDeleteNode);

  const [quantity, setQuantity] = useState(PRODUCTION_QUANTITY);
  const [animationState, setAnimationState] = useState(false);
  const [name, setName] = useState(data.label);
  const [isToggle, setIsToggle] = useState(false);
  const [totalSent, setTotalSent] = useState(0);

  const isForTheCodingChallange =
    process.env.REACT_APP_IS_FOR_CODING_CHALLENGE === 'true';
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');

  useEffect(() => {
    if (animationState) {
      setTimeout(() => {
        animateConnection(id, false);
        setAnimationState(false);
      }, 1800);
    }
  });

  useEffect(() => {
    if (data.connectedQueue && isToggle) {
      const interval = setInterval(() => {
        _onClick(id);
      }, 10000);
      return () => clearInterval(interval);
    }
  });

  const _onClick = id => {
    setAnimationState(true);
    animateConnection(id, true);
    try {
      if (isForTheCodingChallange) {
        adapter
          .put(quantity, 1, data.connectedQueue, selectedCurrency)
          .then(() => {
            sendMessages(id, quantity);
            setTotalSent(prev => prev + quantity);
            if (isToggle) adapter.closeProducer();
          });
      } else {
        let message = 'You bought a new ticket!';
        adapter.put(message, quantity, data.connectedQueue).then(() => {
          sendMessages(id, quantity);
          setTotalSent(prev => prev + quantity);
          if (isToggle) adapter.closeProducer();
        });
      }
    } catch (e) {
      console.log(e);
      setAnimationState(false);
    }
  };

  const handleOnChange = (e, value) => {
    var delta = value.direction === 'up' ? 1 : -1;
    setQuantity(quantity + delta);
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
          onChange={e => setName(e.target.value)}
        />

        <Grid>
          <Column lg={9}>
            <NumberInput
              id={`producer-quantity-${id}`}
              invalidText="Number is not valid"
              helperText="Amount"
              max={100}
              min={1}
              step={1}
              value={quantity}
              onChange={handleOnChange}
            />
          </Column>
          <Column lg={7}>
            <Dropdown
              id={`producer-currency-${id}`}
              items={[
                { id: '1', text: 'EUR' },
                { id: '2', text: 'USD' },
                { id: '3', text: 'GBP' },
              ]}
              itemToString={item => (item ? item.text : '')}
              selectedItem={{ text: selectedCurrency }}
              onChange={({ selectedItem }) =>
                setSelectedCurrency(selectedItem.text)
              }
              helperText="Currency"
            />
          </Column>
        </Grid>

        <Button
          renderIcon={props => <Send size={20} {...props} />}
          size="sm"
          kind="primary"
          style={{ width: '100%' }}
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
        onChange={e => setName(e.target.value)}
      />

      <NumberInput
        id={`producer-tickets-${id}`}
        invalidText="Number is not valid"
        label="Quantity per request"
        max={100}
        min={1}
        step={1}
        value={quantity}
        onChange={handleOnChange}
      />

      <Button
        size="sm"
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
