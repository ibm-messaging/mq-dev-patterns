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

import React, { useEffect, useState, memo } from 'react';
import { Handle } from 'react-flow-renderer';
import ProgressBar from '@carbon/react/lib/components/ProgressBar/ProgressBar';
import './map.css';
import APIAdapter from '../../adapters/API.adapter';
import useStore from '../MQPatterns/PointToPoint/store';
import { toast } from 'react-toastify';

const MAX_QUEUE_DEPTH = 500;
const QueueNode = ({ id, data, isConnectable }) => {
  const adapter = new APIAdapter();

  const [currentDepth, setCurrentDepth] = useState(0);
  const _updateQueuedata = useStore(state => state.updateQueueData);
  const deleteMe = useStore(state => state.onDeleteNode);

  const [isTmpQueue, setIsTmpQueue] = useState(false);
  const [canSend, setCandSend] = useState(true);

  useEffect(() => {
    if (data.queueName.indexOf('APP.REPLIES') > -1) {
      setIsTmpQueue(true);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        if(canSend) {
          setCandSend(false);
          let result = await adapter.getAllDepths(false);        
          setCandSend(true);
          if (!Number.isInteger(result)) {
            let _lastDepth = result.find(q => q.name === data.queueName)['depth'];        
            _updateQueuedata(result);
            setCurrentDepth(_lastDepth);
          } else if (result === 525 ) {
            // MQ manager not reachable
            toast.error("The queue manager is not reachable.");
          } else if (result === 505) {
            // Error on getting qdepth
            toast.error("The backend server is not reachable.");
          }
        }
       
        
      } catch (e) {
        console.log(e);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={
        !isTmpQueue ? `queue-node-container` : `queue-node-container blob`
      }>
      <button
        style={{ right: '50%' }}
        className="edgebutton node"
        onClick={() => {
          deleteMe(id, true);
        }}>
        X
      </button>
      {!isTmpQueue ? (
        <>
          <Handle
            type="target"
            position="left"
            style={{
              background: '#0050e6',
            }}
            onConnect={params => console.log('handle onConnect', params)}
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position="right"
            style={{ background: 'orange' }}
            onConnect={params => console.log('handle onConnect', params)}
            isConnectable={isConnectable}
          />
        </>
      ) : (
        <></>
      )}

      {isTmpQueue ? (
        <>
          <Handle
            type={'target'}
            position={'right'}
            style={{ background: 'orange' }}
            onConnect={params => console.log('handle onConnect', params)}
            isConnectable={isConnectable}
          />

          <Handle
            type={'source'}
            position={'left'}
            style={{ background: 'orange' }}
            onConnect={params => console.log('handle onConnect', params)}
            isConnectable={isConnectable}
          />
        </>
      ) : (
        <></>
      )}

      <div className="queue-image" />

      <ProgressBar
        className="mq--progress-bar--progress"
        label={
          currentDepth +
          ' ' +
          (isTmpQueue ? 'Responses' : 'Requests') +
          ' (' +
          ((currentDepth / MAX_QUEUE_DEPTH) * 100).toFixed(0) +
          '%)'
        }
        max={MAX_QUEUE_DEPTH}
        size="big"
        value={currentDepth}
        helperText={data.queueName + '   | Max depth: ' + MAX_QUEUE_DEPTH}
      />
    </div>
  );
};

export default memo(QueueNode);
