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
import useStore from '../MQPatterns/RequestResponse/store';
import NumberInput from '@carbon/react/lib/components/NumberInput/NumberInput';
import './map.css';
import FormLabel from '@carbon/react/lib/components/FormLabel/FormLabel';
import TextInput from '@carbon/react/lib/components/TextInput';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

const RequestorNode = ({ id, data }) => {
  const adapter = new APIAdapter();
  const animateConnection = useStore(
    state => state.changeEdgeAnimationFromNodeId
  );
  const deleteMe = useStore(state => state.onDeleteNode);
  const _drawTmpQueue = useStore(state => state.creteTmpQueue);
  const _drawTmpConnection = useStore(state => state.drawTmpConnection);
  const _deleteTmpQueue = useStore(
    state => state.deleteTmpQueueFromTmpQueueName
  );
  const [quantity, setQuantity] = useState(1);
  const [animationState, setAnimationState] = useState(false);
  const [name, setName] = useState(data.label);
  const [tmpQueueName, setTmpQueueName] = useState();
  const [isWaitingForReply, setIsWaitingForReply] = useState(false);
  const [responseMessage, setResponseMessage] = useState();
  const [sessionID, setSessionID] = useState();

  useEffect(() => {
    let _sessionID = Cookies.get("sessionID");        
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
    try {
      let message = 'Request';
      // Adapter DYNPUT
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
      <Handle
        type={'target'}
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
        label="Quantity request: "
        // warn={currentSubscribers == 0}
        // warnText="At least 1 sub to start the pattern is required"
        max={100}
        min={1}
        step={10}
        value={quantity}
        onChange={handleOnChange}
      />

      <Button
        className="producer-node-send-button"
        size="sm"
        disabled={isWaitingForReply}
        onClick={() => {
          _onClick(id);
        }}>
        Submit Request
      </Button>

      <FormLabel className={'consumer-subsection-title'}>
        Response: {responseMessage}
      </FormLabel>
    </div>
  );
};

export default memo(RequestorNode);
