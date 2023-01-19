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

import React, { useCallback } from 'react';
import { Button } from '@carbon/react';
import { Handle } from 'react-flow-renderer';

const BasicNode = ({ data, isConnectable }) => {
  const _onClick = useCallback(evt => {
    data.onClick();
  }, []);

  return (
    <div>
      <Handle
        type={data.role.indexOf('P') > -1 ? 'source' : 'target'}
        position={data.role.indexOf('P') > -1 ? 'right' : 'left'}
        style={{ background: '#555' }}
        onConnect={params => console.log('handle onConnect', params)}
        isConnectable={isConnectable}
      />

      <Button
        size="sm"
        tooltip="hello"
        kind={data.isActive ? 'primary' : 'secondary'}
        onClick={_onClick}>
        {data.label}
      </Button>
    </div>
  );
};

export default BasicNode;
