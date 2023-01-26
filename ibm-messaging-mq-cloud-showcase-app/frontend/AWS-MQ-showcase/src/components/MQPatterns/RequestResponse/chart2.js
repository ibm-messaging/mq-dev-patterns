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

import React, { useState } from 'react';
import { GroupedBarChart } from '@carbon/charts-react';
import '@carbon/charts/styles.css';
// Or
// import "@carbon/charts/styles/styles.scss";

// IBM Plex should either be imported in your project by using Carbon
// or consumed manually through an import
import './chart.css';

const DEFAULTOPTION = {
  title: 'Queue Manager 1',
  axes: {
    left: {
      mapsTo: 'value',
      title: 'Queues depth',
      thresholds: [
        {
          value: 5000,
          label: 'Max depth',
          fillColor: 'orange',
        },
      ],
    },
    bottom: {
      scaleType: 'labels',
      mapsTo: 'key',
      title: 'Queues',
    },
  },
  height: '400px',
};

const Chart2 = props => {  
  return <GroupedBarChart data={props.data} options={DEFAULTOPTION} />;
};

export default Chart2;
