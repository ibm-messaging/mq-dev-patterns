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
import PublisherNode from '../../Map/Publisher.node';
import SubscriberNode from '../../Map/Subscriber.node';
import TopicNode from '../../Map/Topic.node';
import CustomEdge from '../../Map/Custom-pubsub.edge';
import '../../Map/map.css';
import useStore from './store';
import Sidebar from './Sidebar';

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
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,    
    onConnect,
  } = useStore();

  const _addNode = useStore(state => state.addNode);

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
            label: 'Publisher',
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
            label: 'Subscriber',
            connectedQueue: '',
            subscriptionState: 0,
          },
          position: position,
          targetPosition: 'left',
          draggable: true,
        };
      } else if (type === 'queue') {
        node = {
          id: getId(),
          type: 'queue',
          isAqueue: 1,
          data: {
            role: 'q',
            depth: 0,
            queueName: '',
          },
          position: position,
          sourcePosition: 'right',
          targetPosition: 'left',
          draggable: true,
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
            // onEdgeUpdate={onEdgeUpdate}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={setReactFlowInstance}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            className="touchdevice-flow"
            defaultZoom={0.5}>
            <Background variant="lines" />
            <Controls />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
}

export default Flow;
