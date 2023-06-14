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
import {
  Grid,
  Column,
  Row,
  Toggle,
  Tag,
  TextInput,
  Dropdown,
} from '@carbon/react';
import { Handle } from 'react-flow-renderer';
import APIAdapter from '../../adapters/API.adapter';
import useStore from '../MQPatterns/PointToPoint/store';
import FormLabel from '@carbon/react/lib/components/FormLabel/FormLabel';
import './map.css';

const ConsumerNode = ({ id, data }) => {
  const adapter = new APIAdapter();
  const _onClick = useStore(state => state.onClick);
  const deleteMe = useStore(state => state.onDeleteNode);
  const [lastMessage, setLastMessage] = useState();
  const [sessionCount, setSessionCount] = useState(0);

  const [name, setName] = useState(data.label);
  const animateConnection = useStore(
    state => state.changeEdgeAnimationFromNodeId
  );

  const isForTheCodingChallange =
    process.env.REACT_APP_IS_FOR_CODING_CHALLENGE === 'true';
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');

  const closeConsumerConnection = async () => {
    try {
      await adapter.closeConsumer(id);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (data.isActive && data.connectedQueue) {
      const interval = setInterval(async () => {
        try {
          animateConnection(id, true);
          let _lastMessages;
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
            setSessionCount(state => state + 1);
          }
        } catch (e) {
          console.log(e);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  });

  const changeName = e => {
    setName(e.value);
  };

  if (isForTheCodingChallange) {
    return (
      <div
        style={{ width: 400 }}
        className={`consumer-node-container ${data.isActive && 'blob'}`}>
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
            backgroundColor: data.connectedQueue ? '#555' : 'orange',
            marginRight: 10,
          }}
          isConnectable={!data.connectedQueue}
        />

        <Grid>
          <Column md={16} lg={16} sm={16}>
            <Grid>
              <Column md={10} lg={10} sm={10}>
                <TextInput
                  className="consumer-node-name-label"
                  value={name}
                  size="sm"
                  onChange={e => changeName(e)}
                />
              </Column>
              <Column md={4} lg={4} sm={4}>
                <div style={{ width: 200 }}>
                  <Tag type={!data.isActive ? 'red' : 'green'}>
                    {' '}
                    {data.isActive ? 'Active' : 'Inactive'}{' '}
                  </Tag>
                </div>
              </Column>
            </Grid>
          </Column>

          <Column md={16} lg={16} sm={16}>
            <Grid>
              <Column md={14} lg={14} sm={14}>
                <Dropdown
                  items={[
                    { id: '1', text: 'EUR' },
                    { id: '2', text: 'USD' },
                    { id: '3', text: 'GBP' },
                  ]}
                  itemToElement={item =>
                    item ? (
                      <span className="test" style={{ color: 'red' }}>
                        {item.text}
                      </span>
                    ) : (
                      ''
                    )
                  }
                  selectedItem={selectedCurrency}
                  onChange={({ selectedItem }) => {
                    setSelectedCurrency(selectedItem.text);
                  }}
                  helperText={'Filtering by ' + selectedCurrency}
                />
              </Column>
              <Column md={2} lg={2} sm={2}>
                <div style={{ width: 200 }}>
                  <Toggle
                    id={id}
                    size="sm"
                    disabled={!data.connectedQueue}
                    toggled={data.isActive}
                    onToggle={() => {
                      _onClick(id);
                    }}
                  />
                </div>
              </Column>
            </Grid>
          </Column>
          <br />

          <Column md={16} lg={16} sm={16}>
            <FormLabel className="consumer-subsection-title">
              Last payment:
            </FormLabel>
          </Column>
          <Column md={16} lg={16} sm={16}>
            <FormLabel>
              Amount Received: {lastMessage?.message?.Message} | Currency:{' '}
              {lastMessage?.currency}
            </FormLabel>
          </Column>
          <Column md={16} lg={16} sm={16}>
            <FormLabel>
              Date:
              {lastMessage?.message?.Sent?.substring(0, 25)}
            </FormLabel>
          </Column>
          <Column md={16} lg={16} sm={16}>
            <FormLabel>Counter: {lastMessage?.message?.count}</FormLabel>
          </Column>
          <Column md={16} lg={16} sm={16}>
            <FormLabel>Payments Received: {sessionCount}</FormLabel>
          </Column>
        </Grid>
      </div>
    );
  } else {
    return (
      <div
        style={{ width: 400 }}
        className={`consumer-node-container ${data.isActive && 'blob'}`}>
        <button
          className="edgebutton node"
          too
          onClick={() => {
            deleteMe(id);
            closeConsumerConnection();
          }}>
          X
        </button>
        <Handle
          type={'target'}
          position={'left'}
          style={{
            zIndex: 200,
            backgroundColor: data.connectedQueue ? '#555' : 'orange',
            marginRight: 10,
          }}
          isConnectable={!data.connectedQueue}
        />


        <div style={{display: "flex", paddingRight: "10px"}}>          
            <TextInput            
              style={{marginRight: "30px"}}
              className="consumer-node-name-label"
              value={name}
              size="sm"
              onChange={e => changeName(e)}
            />
                      
            <Toggle                          
              id={id}
              size="sm"
              disabled={!data.connectedQueue}
              toggled={data.isActive}
              onToggle={() => {
                _onClick(id);
              }}
            />
          
        </div>

            <Tag style={{height:"5px", position: "absolute", right: "10px", bottom: "5px"}} type={!data.isActive ? 'red' : 'green'}>
                  {' '}
                  {data.isActive ? 'Buying tickets' : 'Service inactive'}{' '}
            </Tag>

            <FormLabel className="consumer-subsection-title">
              Last ticket received:
            </FormLabel>
            
            <br></br>
            <FormLabel>
              Type: {lastMessage?.Message} | Date:{' '}
              {lastMessage?.Sent?.substring(0, 25)}
            </FormLabel>
            <br></br>
            <FormLabel>Counter: {lastMessage?.Count}</FormLabel>
            <br></br>
            <FormLabel>Tickets Received: {sessionCount}</FormLabel>
     

      </div>
    );
  }
};

export default ConsumerNode;
