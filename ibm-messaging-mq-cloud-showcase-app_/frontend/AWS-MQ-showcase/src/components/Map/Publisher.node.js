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

import React, { useEffect, useState, useRef } from 'react';
import { Send } from '@carbon/react/icons';
import { Button, TextArea } from '@carbon/react';
import { Handle } from 'react-flow-renderer';
import APIAdapter from '../../adapters/API.adapter';
import useStore from '../MQPatterns/PubSub/store';
import './map.css';
import TextInput from '@carbon/react/lib/components/TextInput';
import { toast } from 'react-toastify';

const PublisherNode = ({ id, data }) => {
  const adapter = new APIAdapter();
  const animateConnection = useStore(
    state => state.changeEdgeAnimationFromNodeId
  );
  const deleteMe = useStore(state => state.onDeleteNode);    
  const [animationState, setAnimationState] = useState(false);
  const [isToggleOn] = useState(false);
  const [message, setMessage] = useState();
  const [title, setTitle] = useState();
  const [canSend, setCandSend] = useState(true);  
  const refTitle = useRef('');
  const refMessage = useRef('');

  useEffect(() => {
    if (data.connectedQueue && isToggleOn) {
      const interval = setInterval(() => {
        publish();
      }, 20000);
      return () => clearInterval(interval);
    }
  });

  const onClick = () => {
    publish();
  };

  const publish = () => {
    if(canSend) {
      setCandSend(false);
      setAnimationState(true);
      animateConnection(id, true);
      try {
        let _title = refTitle.current.value;
        let _message = refMessage.current.value;
        let messageToSend = _title + '|@|' + _message;
        let promise = new Promise((resolve, reject) => {
          adapter
            .publish(messageToSend, 1, data.connectedQueue, id)
            .then(res => {
              setCandSend(true);
              resolve();
            })
            .catch(err => {
              setCandSend(true);
              reject();
            });
        });
        toast.promise(promise, {
          pending: 'Sending your notification...',
          success: 'Your notification has been sent with sucess',
          error: 'Error on sending your notification',
        });
      } catch (e) {
        console.log(e);
        setCandSend(true);
        setAnimationState(false);
      }      
    }  
  };

  useEffect(() => {
    if (animationState) {
      setTimeout(() => {
        animateConnection(id, false);
        setAnimationState(false);
      }, 1000);
    }
  }, [animationState]);  

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
        ref={refTitle}
        labelText="Title of your noitfication"
        value={title}
        placeholder="Waitlist reminder"
        onChange={e => setTitle(e.value)}
      />
      <br />
      <TextArea
        size="sm"
        ref={refMessage}
        labelText="Content of your notification"
        placeholder={'Do not FORGET our WAITLIST!' + data.connectedQueue}
        value={message}
        onChange={e => setMessage(e.value)}
      />
      <br />

      <Button
        renderIcon={props => <Send size={42} {...props} />}
        className="publisher-node-send-button"
        size="sm"
        disabled={!data.connectedQueue || animationState}
        onClick={() => {
          onClick();
        }}>
        Send Notification
      </Button>
    </div>
  );
};

export default PublisherNode;
