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

const initialEdges = [
  {
    id: '1-3',
    source: '1',
    target: '3',
    animated: false,
    style: {
      stroke: '#0050e6',
      strokeWidth: 1,
    },
    type: 'custom',
  },
  {
    id: '3-2',
    source: '3',
    target: '2',
    type: 'custom',
    animated: false,
    style: {
      stroke: '#0050e6',
      strokeWidth: 1,
    }
  },
  // {
  //   id: '3-6',
  //   source: '3',
  //   target: '6',
  //   type: 'custom',
  //   animated: false,
  //   style: {
  //     stroke: '#0050e6',
  //     strokeWidth: 1,
  //   },
  //   type: 'custom',
  // },
];

export default initialEdges;