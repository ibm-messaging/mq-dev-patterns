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

import React, { useEffect, useState } from 'react';
import { Handle } from '@xyflow/react';
import { TextInput } from '@carbon/react';
import { Close, MediaCast } from '@carbon/react/icons';
import { toast } from 'react-toastify';
import useStore from '../MQPatterns/PubSub/store';
import './NodeCard.scss';

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
    <div className="topic-node">
      <button
        className="topic-node__close"
        aria-label="Delete Topic"
        onClick={() => deleteMe(id, true)}>
        <Close size={10} />
      </button>

      {!isAWildcard && (
        <Handle
          type="target"
          position="left"
          className="topic-node__handle topic-node__handle--left"
          isConnectable={isConnectable}
        />
      )}

      <Handle
        type="source"
        position="right"
        className="topic-node__handle topic-node__handle--right"
        isConnectable={isConnectable}
      />

      <div className="topic-node__inner">
        <MediaCast size={22} className="topic-node__icon" />
        <span className="topic-node__label">TOPIC</span>
        <div className="topic-node__input-wrap">
          <TextInput
            id={`topic-name-${id}`}
            labelText=""
            hideLabel
            value={data.queueName}
            size="sm"
            placeholder="tickets/classic"
            onChange={e => onTextInputChange(e)}
            className="topic-node__input"
          />
        </div>
      </div>
    </div>
  );
};

export default TopicNode;
