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

import { useCallback, useRef, useState, type DragEvent } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
} from '@xyflow/react';
import type { ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import PublisherNode from '../../Map/Publisher.node';
import SubscriberNode from '../../Map/Subscriber.node';
import TopicNode from '../../Map/Topic.node';
import CustomEdge from '../../Map/Custom-pubsub.edge';
import '../../Map/map.scss';
import useStore from './store';
import Sidebar from './Sidebar';
import type { MQFlowNode } from '../../../types';

const nodeTypes = {
  consumer: SubscriberNode,
  queue: TopicNode,
  producer: PublisherNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

let id = 50;
const getId = () => `${id++}`;

function Flow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useStore();

  const _addNode = useStore((state) => state.addNode);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      if (type === 'producer') {
        _addNode({
          id: getId(),
          type: 'producer',
          data: {
            role: 'Producer',
            label: 'Publisher',
            connectedQueue: '',
            isActive: false,
          },
          position,
          sourcePosition: 'right',
        } as MQFlowNode);
        return;
      }

      if (type === 'consumer') {
        _addNode({
          id: getId(),
          type: 'consumer',
          data: {
            role: 'Consumer',
            label: 'Subscriber',
            connectedQueue: '',
            subscriptionState: 0,
          },
          position,
          targetPosition: 'left',
          draggable: true,
        } as MQFlowNode);
        return;
      }

      if (type === 'queue') {
        _addNode({
          id: getId(),
          type: 'queue',
          data: {
            role: 'q',
            depth: 0,
            queueName: '',
          },
          position,
          sourcePosition: 'right',
          targetPosition: 'left',
          draggable: true,
        } as MQFlowNode);
      }
    },
    [reactFlowInstance]
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="dndflow">
      <ReactFlowProvider>
        <Sidebar />
        <div className="reactflow-wrapper" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={setReactFlowInstance}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            className="touchdevice-flow"
            defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}>
            <Background
              variant={BackgroundVariant.Lines}
              gap={20}
              size={1}
              color="var(--cds-border-subtle-00, #e0e0e0)"
            />
            <Controls />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
}

export default Flow;
