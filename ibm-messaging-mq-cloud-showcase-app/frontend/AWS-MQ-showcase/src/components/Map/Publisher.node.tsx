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

import { useEffect, useState, useRef } from 'react';
import { Send } from '@carbon/react/icons';
import { Button, TextArea, TextInput } from '@carbon/react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { blue60Hover } from '@carbon/colors';
import APIAdapter from '../../adapters/API.adapter';
import useStore from '../MQPatterns/PubSub/store';
import NodeCard from './NodeCard';
import AppIcon from './AppIcon';
import { toast } from 'react-toastify';
import { SHOWCASE_APP_CONSTANTS } from './utils';
import type { ProducerFlowNode } from '../../types';

const { HEADER_BG_BLUE: HEADER_BG, HEADER_BORDER_BLUE: HEADER_BORDER } =
  SHOWCASE_APP_CONSTANTS;

// R-Pub-2 (raised, not fixed): new APIAdapter() runs on every render.
const PublisherNode = ({ id, data }: NodeProps<ProducerFlowNode>) => {
  const adapter = new APIAdapter();
  const animateConnection = useStore(
    (state) => state.changeEdgeAnimationFromNodeId
  );
  const publisherSent = useStore((state) => state.publisherSent);
  const deleteMe = useStore((state) => state.onDeleteNode);

  const [animationState, setAnimationState] = useState(false);
  const [canSend, setCandSend] = useState(true);
  const refTitle = useRef<HTMLInputElement>(null);
  const refMessage = useRef<HTMLTextAreaElement>(null);

  const onClick = () => {
    publish();
  };

  const publish = () => {
    if (canSend) {
      setCandSend(false);
      setAnimationState(true);
      animateConnection(id, true);

      const _title = refTitle.current?.value ?? '';
      const _message = refMessage.current?.value ?? '';
      const messageToSend = _title + '|@|' + _message;

      const promise = new Promise<void>((resolve, reject) => {
        adapter
          .publish(messageToSend, 1, data.connectedQueue, id)
          .then(() => {
            setCandSend(true);
            publisherSent(id);
            resolve();
          })
          .catch(() => {
            setCandSend(true);
            reject();
          });
      });

      toast.promise(promise, {
        pending: 'Sending your notification...',
        success: 'Your notification has been sent with success',
        error: 'Error on sending your notification',
      });
    }
  };

  useEffect(() => {
    if (animationState) {
      const t = setTimeout(() => {
        animateConnection(id, false);
        setAnimationState(false);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [animationState]);

  return (
    <NodeCard
      headerBg={HEADER_BG}
      headerBorderColor={HEADER_BORDER}
      icon={<AppIcon size={20} />}
      title="Publisher app"
      onDelete={() => deleteMe(id)}>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          zIndex: 200,
          backgroundColor: data.connectedQueue ? '#555' : blue60Hover,
        }}
        isConnectable={!data.connectedQueue}
      />

      <TextInput
        id={`publisher-title-${id}`}
        size="sm"
        ref={refTitle}
        labelText="Notification title"
        placeholder="Waitlist reminder"
      />

      <TextArea
        ref={refMessage}
        labelText="Notification content"
        placeholder={"Don't forget about our WAITLIST! " + data.connectedQueue}
      />

      <Button
        renderIcon={(props) => <Send size={20} {...props} />}
        size="lg"
        kind="primary"
        style={{ width: '100%' }}
        disabled={!data.connectedQueue || animationState}
        onClick={onClick}>
        Send notification
      </Button>
    </NodeCard>
  );
};

export default PublisherNode;
