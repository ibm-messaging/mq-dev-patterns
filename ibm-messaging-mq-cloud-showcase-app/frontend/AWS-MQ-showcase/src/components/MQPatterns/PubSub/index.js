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

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Column,  
} from '@carbon/react';
import Chart1 from './chart1';
import './index.scss';
import Flow from '../PubSub/map';
import useStore from './store';

const PubSub = props => {
  const [dataChart1, setDataChart1] = useState([]);
  const [time, setTime] = useState(1);    
  const _updateDataframe = useStore(state => state.setDataframeForChart);

  useEffect(() => {
    let dataframe = _updateDataframe();
    updateChart(dataframe);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      let dataframe = _updateDataframe();
      updateChart(dataframe);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  function updateChart(result) {
    if (result) {
      let _dataChart1 = [...dataChart1];
      result.forEach(entry => {
        _dataChart1.push({
          group: entry.group,
          time: time,
          value: entry.value,
        });
      });
      setDataChart1(_dataChart1);
      setTime(time + 1);
    }
  }

  return (
    <Grid>
      <Column md={8} lg={16} sm={4} className="landing-page__tab-content">
        <div style={{ height: 700, marginBottom: 10 }}>
          <Flow />
        </div>
        <Chart1 data={dataChart1} />

        <Column md={8} lg={16} sm={4}>
          <Grid className="chartSection">
            <Column md={16} />
            {/* <Column md={8} lg={{ offset: 8 }} sm={3}>
              <Chart2 data={dataChart2} />
            </Column> */}
          </Grid>
        </Column>
      </Column>
    </Grid>
  );
};

export default PubSub;
