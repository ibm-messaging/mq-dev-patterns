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

import { useEffect, useState } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { TextInput } from '@carbon/react';
import { Close, MediaCast } from '@carbon/react/icons';
import useStore from '../MQPatterns/PubSub/store';
import './NodeCard.scss';
import type { QueueFlowNode } from '../../types';

const INVALID_CHARACTERS = /[!@$%^&*()_+\-=[\]{};':"\\|,.<>?]+/;
const INVALID_TOPIC_NAME_TEXT = 'Invalid topic name';

interface TopicValidation {
  isValid: boolean;
  isWildcard: boolean;
}

const validateTopicName = (text = ''): TopicValidation => {
  if (INVALID_CHARACTERS.test(text)) {
    return { isValid: false, isWildcard: false };
  }
  const index = text.indexOf('#');
  if (index === -1) {
    return { isValid: true, isWildcard: false };
  }
  const isWildcard = index === text.length - 1 && text[index - 1] === '/';
  return { isValid: isWildcard, isWildcard };
};

const TopicNode = ({ id, data, isConnectable }: NodeProps<QueueFlowNode>) => {
  const _updateTopicName = useStore((state) => state.updateTopicName);
  const deleteMe = useStore((state) => state.onDeleteNode);
  const updateNodeInternals = useUpdateNodeInternals();
  const [inputValue, setInputValue] = useState(data.queueName ?? '');
  const [isInvalid, setIsInvalid] = useState(false);

  const isAWildcard = validateTopicName(data.queueName).isWildcard;

  useEffect(() => {
    updateNodeInternals(id);
  }, [isAWildcard, id, updateNodeInternals]);

  const onTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const { isValid } = validateTopicName(text);
    setInputValue(text);
    setIsInvalid(!isValid);
    if (isValid) {
      _updateTopicName(id, text);
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
          position={Position.Left}
          className="topic-node__handle topic-node__handle--left"
          isConnectable={isConnectable}
        />
      )}

      <Handle
        type="source"
        position={Position.Right}
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
            value={inputValue}
            size="sm"
            placeholder="tickets/classic"
            onChange={onTextInputChange}
            invalid={isInvalid}
            invalidText={INVALID_TOPIC_NAME_TEXT}
            className="topic-node__input"
          />
        </div>
      </div>
    </div>
  );
};

export default TopicNode;
