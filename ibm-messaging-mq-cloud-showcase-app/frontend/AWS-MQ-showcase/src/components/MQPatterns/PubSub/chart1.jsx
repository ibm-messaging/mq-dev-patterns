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
import { LineChart } from '@carbon/charts-react';
import '@carbon/charts/styles.css';

import './chart.css';

const DEFAULTOPTION = {
  title: 'Queue manager 1',
  axes: {
    bottom: {
      title: 'Time',
      mapsTo: 'time',
      scaleType: 'linear',
    },
    left: {
      mapsTo: 'value',
      title: 'Subscribers depth',
      scaleType: 'linear',
      thresholds: [
        {
          value: 5,
          label: 'Max number of subscribers per topic',
          fillColor: 'orange',
        },
      ],
    },
  },
  curve: 'curveMonotoneX',
  height: '400px',
};

const Chart1 = props => {
  return <LineChart data={props.data} options={DEFAULTOPTION} />;
};

export default Chart1;
