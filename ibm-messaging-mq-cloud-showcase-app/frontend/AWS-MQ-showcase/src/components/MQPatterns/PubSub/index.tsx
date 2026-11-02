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

import { useState, useEffect } from 'react';
import { Grid, Column } from '@carbon/react';
import Chart1 from './chart1';
import './index.scss';
import Flow from './map';
import useStore from './store';
import type { LineChartEntry, DataframeEntry } from '../../../types';

const PubSub = () => {
  const [dataChart1, setDataChart1] = useState<LineChartEntry[]>([]);
  const [time, setTime] = useState(1);
  const _updateDataframe = useStore((state) => state.setDataframeForChart);

  const updateChart = (result: DataframeEntry[]) => {
    let _dataChart1 = [...dataChart1];
    result.forEach((entry) => {
      _dataChart1.push({
        group: entry.group,
        time,
        value: entry.value,
      });
    });
    setDataChart1(_dataChart1);
    setTime((t) => t + 1);
  };

  useEffect(() => {
    updateChart(_updateDataframe());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      updateChart(_updateDataframe());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Grid condensed>
      <Column md={8} lg={16} sm={4} className="landing-page__tab-content">
        <div className="flow-container">
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
