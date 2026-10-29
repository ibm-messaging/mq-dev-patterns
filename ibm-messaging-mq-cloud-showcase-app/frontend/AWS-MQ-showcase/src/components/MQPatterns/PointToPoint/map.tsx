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
import type { ReactFlowInstance, OnNodesChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ProducerNode from '../../Map/Producer.node';
import ConsumerNode from '../../Map/Consumer.node';
import QueueNode from '../../Map/Queue.node';
import CustomEdge from '../../Map/Custom.edge';
import '../../Map/map.scss';
import useStore from './store';
import Sidebar from './Sidebar';
import type { MQFlowNode } from '../../../types';

const nodeTypes = {
  producer: ProducerNode,
  consumer: ConsumerNode,
  queue: QueueNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

let id = 150;
const getId = () => `${id++}`;

const AVAILABLE_QUEUE_NAMES = ['DEV.QUEUE.1', 'DEV.QUEUE.2', 'DEV.QUEUE.3'];

function Flow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onReconnect, onConnect } =
    useStore();

  const _addNode = useStore((state) => state.addNode);
  const getQueues = useStore((state) => state.getQueuesNodes);

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
            label: 'Producer Name',
            connectedQueue: '',
            isActive: false,
          },
          position,
          sourcePosition: 'right',
        } as MQFlowNode); // cast: drop literal to the store's union; all discriminants are satisfied
        return;
      }

      if (type === 'consumer') {
        _addNode({
          id: getId(),
          type: 'consumer',
          data: {
            role: 'Consumer',
            label: 'Consumer Name',
            connectedQueue: '',
            isActive: false,
          },
          position,
          sourcePosition: 'left',
        } as MQFlowNode); // cast: drop literal to the store's union; all discriminants are satisfied
        return;
      }

      if (type === 'queue' && getQueues().length <= 1) {
        const usedNames = getQueues().map((q) => q.data.queueName);
        const availableName = AVAILABLE_QUEUE_NAMES.find(
          (n) => !usedNames.includes(n)
        );
        if (!availableName) return;
        _addNode({
          id: getId(),
          type: 'queue',
          label: availableName,
          data: {
            role: 'q',
            depth: 0,
            queueName: availableName,
          },
          position,
          targetPosition: 'left',
        } as MQFlowNode); // cast: drop literal to the store's union; all discriminants are satisfied
      }
    },
    [reactFlowInstance, _addNode, getQueues]
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
            onNodesChange={onNodesChange as unknown as OnNodesChange}
            onEdgesChange={onEdgesChange}
            onReconnect={onReconnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={setReactFlowInstance}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
            className="touchdevice-flow">
            <Background
              variant={BackgroundVariant.Dots}
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
