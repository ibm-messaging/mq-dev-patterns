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

import React from 'react';
import '../../Map/map.css';
import useStore from './store';
import { Button } from '@carbon/react';

import { Reset } from '@carbon/react/icons';

function Sidebar() {
  const _reset = useStore(state => state.reset);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside style={{ width: 170 }}>
      <div className="description">Add new elements to your model!</div>
      <div
        title="Publisher"
        className="dndnode publisher"
        onDragStart={event => onDragStart(event, 'producer')}
        draggable
      />
      <div
        title="Topic"
        className="dndnode topic"
        onDragStart={event => onDragStart(event, 'queue')}
        draggable
      />
      <div
        title="Subscriber"
        className="dndnode subscriber"
        onDragStart={event => onDragStart(event, 'consumer')}
        draggable
      />
      <Button
        renderIcon={props => <Reset size={42} {...props} />}
        className="reset"
        size="sm"
        onClick={() => {
          _reset();
        }}>
        Reset
      </Button>
    </aside>
  );
}

export default Sidebar;
