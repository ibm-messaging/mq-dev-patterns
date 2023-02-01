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
import { Handle } from 'react-flow-renderer';
import './map.css';

import useStore from '../MQPatterns/PubSub/store';
import { FormLabel, TextInput } from '@carbon/react';
import { toast } from 'react-toastify';

const TopicNode = ({ id, data, isConnectable }) => {
  const _updateTopicName = useStore(state => state.updateTopicName);
  const deleteMe = useStore(state => state.onDeleteNode);
  const [isAWildcard, setIsWildCard] = useState(false);

  useEffect(() => {
    isValidText(data.queueName);
  }, [data.queueName]);

  const isValidText = text => {
    var format = /[!@$%^&*()_+\-=[\]{};':"\\|,.<>?]+/;
    if (format.test(text)) {
      toast.warning('Please use a valid topic name');
      return false;
    }
    let index = text.indexOf('#');
    let _isAWildcard = false;
    let isInvalidName = false;
    // if # is in the topic name
    if (index > -1) {
      let textLength = text.length;
      if (index === textLength - 1) {
        let previousChartIsASlash = text[index - 1] === '/';
        if (previousChartIsASlash) {
          _isAWildcard = true;
        } else {
          isInvalidName = true;
        }
      } else {
        isInvalidName = true;
        _isAWildcard = false;
      }
    }
    if (isInvalidName) {
      toast.warning('Please use a valid topic name');
      return false;
    }
    setIsWildCard(_isAWildcard);
    return true;
  };

  const onTextInputChange = e => {
    let text = e.target.value;
    let isValid = isValidText(text);
    if (isValid) {
      _updateTopicName(id, e.target.value);
    }
  };

  return (
    <div className="topic-node-container">
      <button
        style={{ right: '44%' }}
        className="edgebutton node"
        onClick={() => {
          deleteMe(id, true);
        }}>
        X
      </button>
      {!isAWildcard ? (
        <Handle
          type="target"
          position="left"
          style={{
            background: '#0050e6',
          }}
          onConnect={params => console.log('handle onConnect', params)}
          isConnectable={isConnectable}
        />
      ) : (
        <></>
      )}

      <Handle
        type="source"
        position="right"
        style={{ background: 'orange' }}
        onConnect={params => console.log('handle onConnect', params)}
        isConnectable={isConnectable}
      />

      <FormLabel className="topic-label">Topic:</FormLabel>

      <TextInput
        className="topic-text-input"
        value={data.queueName}
        size="sm"
        onChange={e => onTextInputChange(e)}
      />
    </div>
  );
};

export default TopicNode;
