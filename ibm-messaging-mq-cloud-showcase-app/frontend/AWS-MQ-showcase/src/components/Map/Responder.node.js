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

import React, { useEffect, useState } from 'react';
import { Button, Grid, Column, Toggle, Tag, TextInput } from '@carbon/react';
import { Handle } from 'react-flow-renderer';
import APIAdapter from '../../adapters/API.adapter';
import useStore from '../MQPatterns/RequestResponse/store';
import FormLabel from '@carbon/react/lib/components/FormLabel/FormLabel';
import { Send } from '@carbon/react/icons';
import { toast } from 'react-toastify';
import './map.css';
import Cookies from 'js-cookie';

const ResponderNode = ({ id, data }) => {
  const adapter = new APIAdapter();
  const _onClick = useStore(state => state.onClick);
  const deleteMe = useStore(state => state.onDeleteNode);
  const _drawTmpConnection = useStore(state => state.drawTmpConnection);
  const _animateTmpConnection = useStore(state => state.animateTmpConnection);
  const _deleteTmpConnection = useStore(
    state => state.deleteEdgeFromConnection
  );
  const [lastMessage, setLastMessage] = useState({});
  const [sessionCount, setSessionCount] = useState(0);
  const [name, setName] = useState(data.label);
  const [getNext, setGetNext] = useState(true);
  const [responseMessage, setResponseMesasge] = useState();
  const [replyQueue, setReplyQueue] = useState();
  const [defaultInitQueue, setDefaultInitQueue] = useState();
  const [sessionID , setSessionID] = useState()

  useEffect(() => {    
    let _sessionID = Cookies.get("sessionID");        
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
            _onClick(id);
            setGetNext(true);
            setLastMessage(_lastMessages.message);
            let _replyQueue = _lastMessages.replyQueue;
            setReplyQueue(_replyQueue);
            if (_replyQueue) {
              // Drow connection
              _drawTmpConnection(_replyQueue, id, true);
              toast.success('Message received! It is time to reply!');
            }
            setSessionCount(state => state + 1);
          } catch (e) {
            console.log(e);
          }
        }
      }, 1800);
      return () => clearInterval(interval);
    }
  });

  const changeName = e => {
    setName(e.value);
  };
  const changeResponseMessage = e => {
    setResponseMesasge(e.target.value);
  };
  const onSendResponse = () => {
    _animateTmpConnection(replyQueue, id);
    let _responseMessage = responseMessage;
    adapter
      .dynPut(_responseMessage, 1, replyQueue, 'DYNREP', id)
      .then(res => {
        // animate connection
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
  return (
    <div style={{ width: 400 }} className="consumer-node-container">
      <button
        className="edgebutton node"
        too
        onClick={() => {
          deleteMe(id);
        }}>
        X
      </button>
      <Handle
        type={'target'}
        position={'left'}
        style={{
          zIndex: 200,
          backgroundColor: defaultInitQueue ? '#555' : 'orange',
          marginRight: 10,
        }}
        isConnectable={!defaultInitQueue}
      />
      <Handle
        type={'source'}
        position={'left'}
        style={{
          zIndex: 200,
          backgroundColor: defaultInitQueue ? '#555' : 'orange',
          marginRight: 10,
        }}
        isConnectable={!defaultInitQueue}
      />

      <div style={{ display: 'flex', paddingRight: '10px' }}>
        <TextInput
          style={{ marginRight: '30px' }}
          className="consumer-node-name-label"
          value={name}
          size="sm"
          onChange={e => changeName(e)}
        />
        <div style={{ height: 10 }}>
          <Toggle
            id={id}
            size="sm"
            disabled={!defaultInitQueue}
            toggled={data.isActive}
            onToggle={() => {
              _onClick(id);
            }}
          />
        </div>
      </div>
      <FormLabel>Last message received:</FormLabel>
      <br></br>
      <FormLabel className={'consumer-subsection-title'}>
            {lastMessage?.Message}
      </FormLabel>      
      <FormLabel className={'consumer-subsection-title'}>
            Replying in: {replyQueue}
          </FormLabel>          
          <br></br>
          <FormLabel>Transactions Processed: {sessionCount}</FormLabel>
          <br></br>
          <br></br>
          <TextInput
            className="consumer-node-name-label"
            placeholder="Write here your message"
            value={responseMessage}
            size="sm"
            onChange={e => changeResponseMessage(e)}
          />          

          <Button
            renderIcon={props => <Send size={42} {...props} />}
            className="publisher-node-send-button"
            size="sm"
            onClick={() => {
              onSendResponse();
            }}>
            Reply
          </Button>                    
          
          

      {/* <Grid>
        <Column md={7} lg={{ offset: 13 }} sm={3} />
        <Column md={16} lg={16} sm={16}>
          <FormLabel>Last message received:</FormLabel>
        </Column>
        <Column md={16} lg={16} sm={16}>
          <FormLabel className={'consumer-subsection-title'}>
            {lastMessage?.Message}
          </FormLabel>
        </Column>
        <Column md={16} lg={16} sm={16}>
          <FormLabel className={'consumer-subsection-title'}>
            Replying in: {replyQueue}
          </FormLabel>
        </Column>
        <Column md={8} lg={8} sm={8}>
          <TextInput
            className="consumer-node-name-label"
            placeholder="Write here your message"
            value={responseMessage}
            size="sm"
            onChange={e => changeResponseMessage(e)}
          />
        </Column>
        <Column md={8} lg={8} sm={8}>
          <Button
            renderIcon={props => <Send size={42} {...props} />}
            className="publisher-node-send-button"
            size="sm"
            onClick={() => {
              onSendResponse();
            }}>
            Reply
          </Button>
        </Column>
        <Column md={16} lg={16} sm={16}>
          <FormLabel>Transactions Processed: {sessionCount}</FormLabel>
        </Column>
      </Grid> */}
    </div>
  );
};
export default ResponderNode;
