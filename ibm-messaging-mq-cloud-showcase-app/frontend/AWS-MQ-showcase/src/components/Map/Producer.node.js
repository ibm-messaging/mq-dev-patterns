/**
 * Copyright 2022, 2023 IBM Corp.
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
import { Button } from '@carbon/react';
import { Handle } from 'react-flow-renderer';
import APIAdapter from '../../adapters/API.adapter';
import useStore from '../MQPatterns/PointToPoint/store';
import NumberInput from '@carbon/react/lib/components/NumberInput/NumberInput';
import './map.css';
import TextInput from '@carbon/react/lib/components/TextInput';

const PRODUCTION_QUANTITY = 25;
const ProducerNode = ({ id, data }) => {
  const adapter = new APIAdapter();
  const animateConnection = useStore(
    state => state.changeEdgeAnimationFromNodeId
  );
  const deleteMe = useStore(state => state.onDeleteNode);
  const [quantity, setQuantity] = useState(PRODUCTION_QUANTITY);
  const [animationState, setAnimationState] = useState(false);
  const [name, setName] = useState(data.label);  

  useEffect(() => {
    if (animationState) {
      setTimeout(() => {
        animateConnection(id, false);
        setAnimationState(false);
      }, 1800);
    }
  });

  const _onClick = id => {
    setAnimationState(true);
    animateConnection(id, true);
    try {
      let message = 'You bought a new ticket!';
      adapter.put(message, quantity, data.connectedQueue).then(res => {});      
    } catch (e) {
      console.log(e);
      setAnimationState(false);
    }
  };

  const handleOnChange = (e, value) => {
    var delta = value === 'up' ? 1 : -1;
    setQuantity(quantity + delta);
  };

  const changeName = e => {
    setName(e.value);
  };

  return (
    <div className="producer-node-container">
      <button
        className="edgebutton node"
        too
        onClick={() => {
          deleteMe(id);
        }}>
        X
      </button>
      <Handle
        type={'source'}
        position={'right'}
        style={{
          zIndex: 200,
          backgroundColor: data.connectedQueue ? '#555' : '#0050e6',
        }}
        isConnectable={!data.connectedQueue}
      />
      <TextInput
        size="sm"
        className="producer-node-name-label"
        labelText="Name of your application"
        value={name}
        onChange={e => changeName(e)}
      />

      <NumberInput
        // helperText="At least 1 sub to start the pattern is required"
        id="tj-input"
        invalidText="Number is not valid"
        label="Tickets created: "
        // warn={currentSubscribers == 0}
        // warnText="At least 1 sub to start the pattern is required"
        max={100}
        min={1}
        step={1}
        value={quantity}
        onChange={handleOnChange}
      />

      <Button
        className="producer-node-send-button"
        size="sm"
        disabled={!data.connectedQueue || animationState || quantity<=0}
        onClick={() => {
          _onClick(id);
        }}>
        Create Bookings
      </Button>
    </div>
  );
};

export default memo(ProducerNode);
