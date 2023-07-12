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

import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {    
  Controls,
  Background,  
  ReactFlowProvider,
} from 'react-flow-renderer';
import 'reactflow/dist/style.css';
import ProducerNode from '../../Map/Producer.node';
import ConsumerNode from '../../Map/Consumer.node';
import QueueNode from '../../Map/Queue.node';
import CustomEdge from '../../Map/Custom.edge';
import Container from '../../Map/Container.node';
import '../../Map/map.css';
import useStore from './store';
import Sidebar from './Sidebar';

const nodeTypes = {
  producer: ProducerNode,
  consumer: ConsumerNode,
  queue: QueueNode,
  container: Container,
};

const edgeTypes = {
  custom: CustomEdge,
};

let id = 150;
const getId = () => `${id++}`;
const availableQueueNames = ['DEV.QUEUE.1', 'DEV.QUEUE.2', 'DEV.QUEUE.3'];
function Flow() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onEdgeUpdate,
    onConnect,
  } = useStore();

  const _addNode = useStore(state => state.addNode);
  const getQueues = useStore(state => state.getQueuesNodes);

  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onDrop = useCallback(
    event => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      let node = {};
      if (type === 'producer') {
        node = {
          id: getId(),
          type: type,
          data: {
            role: 'Producer',
            label: 'Producer Name',
            connectedQueue: '',
            isActive: false,
          },
          position: position,
          sourcePosition: 'right',
        };
      } else if (type === 'consumer') {
        node = {
          id: getId(),
          type: type,
          data: {
            role: 'Consumer',
            label: 'Consumer Name',
            connectedQueue: '',
            isActive: false,
          },
          position: position,
          sourcePosition: 'left',
        };
      } else if (type === 'queue' && getQueues().length <= 1) {
        let queues = getQueues();
        let availableNames = availableQueueNames.copyWithin();
        queues.forEach(x => {
          let name = x.data.queueName;
          availableNames = availableNames.filter(n => n !== name);
        });
        node = {
          id: getId(),
          type: type,
          label: availableNames[0],
          data: {
            role: 'q',
            depth: 0,
            queueName: availableNames[0],
          },
          position: position,
          sourcePosition: 'right',
          sourcePosition: 'left',          
        };
      } else {
        return;
      }
      _addNode(node);
    },
    [reactFlowInstance]
  );
  const onDragOver = useCallback(event => {
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
            onEdgeUpdate={onEdgeUpdate}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={setReactFlowInstance}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultPosition={[0, 0]}
            className="touchdevice-flow"
            defaultZoom={0.1}>
            <Background variant="lines" />
            <Controls />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
}

export default Flow;
