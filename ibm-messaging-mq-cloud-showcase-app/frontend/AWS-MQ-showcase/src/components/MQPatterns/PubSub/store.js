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

import create from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  updateEdge,
} from 'react-flow-renderer';
import initialNodes from './nodes';
import initialEdges from './edges';
import MapUtils from '../../Map/utils';
//import { persist } from 'zustand/middleware';
const utils = new MapUtils();

const useStore = create((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  dataframe: [],

  onNodesChange: changes => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: changes => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onEdgeUpdate: (oldEdge, connection) => {
    utils.updateConnectionNodeToQueue(set, get, connection, true);
    set({
      edges: updateEdge(oldEdge, connection, get().edges),
    });
    utils.disabledNonConnetedQueue(set, get, oldEdge, connection);
  },
  reset: () => {
    set({
      nodes: [],
    });
    set({
      edges: [],
    });
  },
  onConnect: connection => {
    var setConnection = utils.updateConnectionNodeToQueue(
      set,
      get,
      connection,
      true
    );

    //change subcription
    if (setConnection) {
      utils.drawConnectionNodeToQueueFromConnection(set, get, connection);
    } else {
      alert('Impossible setting the connection between these two components');
    }
  },
  onClick: nodeId => {
    utils.setActiveNodeAndAnimateFromNodeId(set, get, nodeId);
    //activete nodes connected to the topic
    /*let edge = get().edges.filter (
      edge => edge.source === nodeId
    );
    let topicId = edge[0].target;
    
    let edgesToSubs = get().edges.filter(
      edge  => edge.source === topicId 
    )
    //for each node connected to the topic connected 
    // to the subs animated the connection
    edgesToSubs.map(edge => {
      let idSub = edge.target;
      utils.setActiveNodeAndAnimateFromNodeId(set,get,idSub);
    })*/
  },
  changeEdgeAnimationFromNodeId: (nodeId, state) => {
    utils.animateEdgeFromNodeIds(set, get, nodeId);
  },
  onDeleteEdge: edgeId => {
    utils.updateQueueOnDeletingEdge(set, get, edgeId, true);
    set({
      edges: get().edges.filter(edge => edge.id !== edgeId),
    });
  },
  onDeleteNode: (nodeId, isAQueue = false) => {
    if (isAQueue) {
      // if we are deleting a queue we have to update the connections
      let edges = get().edges.filter(
        edge => edge.target === nodeId || edge.source === nodeId
      );
      edges.forEach(e => {
        get().onDeleteEdge(e.id);
      });
    }
    set({
      nodes: get().nodes.filter(node => node.id !== nodeId),
    });
  },
  addNode: node => {
    set({
      nodes: get().nodes.concat(node),
    });
  },
  getQueuesNodes: () => {
    return get().nodes.filter(node => node.type === 'queue');
  },
  updateTopicName: (id, inputText) => {
    // delete edges

    let edgesToDelete = utils.getEdgesFromNode(set, get, id);
    edgesToDelete.forEach(edge => {
      get().onDeleteEdge(edge.id);
    });

    set({
      nodes: get().nodes.map(node => {
        if (node.id === id) {
          node = {
            ...node,
            data: {
              ...node.data,
              queueName: inputText,
            },
          };
        }
        return node;
      }),
    });
  },
  setDataframeForChart: () => {
    // Each grup is a specific topic
    let _dataframe = [];
    let currentTopicNames = [];
    get().nodes.forEach(node => {
      if (node.data.role === 'q') {
        currentTopicNames.push(node.data.queueName);
      }
    });
    currentTopicNames.forEach(topic => {
      let subsToThisTopic = get().nodes.filter(
        node =>
          node.data.role === 'Consumer' && node.data.connectedQueue === topic
      );
      let numberOfSubsToTopic = subsToThisTopic.length;
      _dataframe.push({
        group: topic,
        value: numberOfSubsToTopic,
      });
    });
    return _dataframe;
  },
  deleteEdgeFromNode: nodeId => {
    // Get the edges connected to the node
    let edges = utils.getEdgesFromNode(set, get, nodeId);
    // if exists more than one edge connected to that nodeId
    if (edges.length > 0) {
      // delete all the edges
      edges.forEach(edge => {
        get().onDeleteEdge(edge.id);
      });
    }
  },
  getAvailableTopic: () => {
    let currentTopicNames = [];
    get().nodes.forEach(node => {
      if (node.data.role === 'q') {
        let _entry = {
          id: node.id,
          text: node.data.queueName,
        };
        currentTopicNames.push(_entry);
      }
    });
    return currentTopicNames;
  },
}));

export default useStore;
