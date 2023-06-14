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
import { Grid, Column, Tag, TextInput } from '@carbon/react';
import { Handle } from 'react-flow-renderer';
import APIAdapter from '../../adapters/API.adapter';
import useStore from '../MQPatterns/PubSub/store';
import FormLabel from '@carbon/react/lib/components/FormLabel/FormLabel';
import './map.css';
import { toast } from 'react-toastify';

const SubscriberNode = ({ id, data }) => {
  const adapter = new APIAdapter();
  const animateConnection = useStore(
    state => state.changeEdgeAnimationFromNodeId
  );
  const [animationState, setAnimationState] = useState(false);
  const _deleteMe = useStore(state => state.onDeleteNode);
  const _deleteEdgeDueToFailingSUb = useStore(
    state => state.deleteEdgeFromNode
  );
  const [lastMessage, setLastMessage] = useState(undefined);
  const [sessionCount, setSessionCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [name, setName] = useState(data.label);
  const [canSend, setCandSend] = useState(true);
  // Randomize the intervals between API invocations.
  const intervalTillTheLastMessage = between(1500, 3500);

  function between(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  useEffect(() => {
    if (data.connectedQueue) {
      const interval = setInterval(async () => {
        try {
          if (canSend) {
            setCandSend(false);
            let _lastMessages = await adapter.getForSubFromAppId(
              id,
              data.connectedQueue
            );
            setCandSend(true);

            if (_lastMessages !== undefined) {
              if (_lastMessages === -1) {
                // if -1 it means that the sub is not subcscribed to
                // the topic. So maybe we can sub it
                setIsSubscribed(true);
                toast.success('Success on subscription');
              } else {
                setAnimationState(true);
                animateConnection(id, true);
                setLastMessage(_lastMessages);
                setSessionCount(state => state + 1);
              }
            }
          }
        } catch (e) {
          console.log(e);
        }
      }, intervalTillTheLastMessage);
      return () => clearInterval(interval);
    }
  });

  useEffect(() => {
    if (animationState) {
      setTimeout(() => {
        animateConnection(id, false);
        setAnimationState(false);
      }, 1000);
    }
  }, [animationState]);

  useEffect(() => {
    switch (data.subscriptionState) {
      // if it is not subscribed
      case 0:
        if (data.connectedQueue) {
          subscribe();
        } else if (!data.connectedQueue) {
          setIsSubscribed(false);
        }
        break;
      // when the connection edge is deleted
      case 2:
        unsub();
        break;
      default:
        break;
    }
  }, [data.subscriptionState]);

  const changeName = e => {
    setName(e.value);
  };

  const unsub = () => {
    let promise = new Promise((resolve, reject) => {
      adapter
        .unsubscribe(id)
        .then(() => {
          resolve();
          setIsSubscribed(false);
        })
        .catch(err => {
          reject();
          setIsSubscribed(false);
        });
    });

    toast.promise(promise, {
      pending: 'Waiting for unsubscribing',
      success: 'Success on unsubscribing',
      error: 'Error on unsubscribing',
    });
  };

  const subscribe = () => {
    let prom = new Promise((resolve, reject) => {
      adapter
        .subscribe(id, data.connectedQueue)
        .then(() => {
          resolve();
          setIsSubscribed(true);
        })
        .catch(err => {
          reject();
          // Clean connection
          _deleteEdgeDueToFailingSUb(id);
          setIsSubscribed(false);
        });
    });
    toast.promise(prom, {
      pending: 'Waiting for subscription',
      success: 'Success on subscribing',
      error: 'Error on subscribing',
    });
  };

  const deleteMe = () => {
    unsub();
    _deleteMe(id);
  };

  return (
    <div className="subscriber-node-container ">
      <button
        className="edgebutton node"
        too
        onClick={() => {
          deleteMe();
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
    
      <TextInput
        className="consumer-node-name-label"
        value={name}
        size="sm"
        onChange={e => changeName(e)}
      />                  

      <Column md={16} lg={16} sm={16}>
        <FormLabel className="consumer-subsection-title">
          Last Notification received:
        </FormLabel>
      </Column>
      <Column md={16} lg={16} sm={16}>
        <FormLabel>Title: {lastMessage?.Title}</FormLabel>
      </Column>
      <Column md={16} lg={16} sm={16}>
        <FormLabel>Message: {lastMessage?.Message}</FormLabel>
      </Column>
      <Column md={16} lg={16} sm={16}>
        <FormLabel>Date: {lastMessage?.Date}</FormLabel>
      </Column>
      <Column md={16} lg={16} sm={16}>
        <FormLabel>Notifications Received: {sessionCount}</FormLabel>
      </Column>

      <Tag  
            style={{height:"5px", position: "absolute", right: "10px", bottom: "5px"}} 
            type={isSubscribed ? 'green' : 'orange'}>
            {isSubscribed
              ? 'Subscribed to: ' + data.connectedQueue
              : 'No subscription'}
        </Tag>
    </div>
  );
};

export default SubscriberNode;
