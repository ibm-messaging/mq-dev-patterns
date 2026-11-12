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

interface ChartState {
  dataChart1: LineChartEntry[];
  time: number;
}

const PubSub = () => {
  const [{ dataChart1 }, setChartState] = useState<ChartState>({
    dataChart1: [],
    time: 1,
  });
  const _updateDataframe = useStore((state) => state.setDataframeForChart);

  // Both effects run with [] deps, so this must not read state from the
  // closure: it appends to the previous chart data at the previous time step.
  const updateChart = (result: DataframeEntry[]) => {
    setChartState((prev) => ({
      dataChart1: [
        ...prev.dataChart1,
        ...result.map((entry) => ({
          group: entry.group,
          time: prev.time,
          value: entry.value,
        })),
      ],
      time: prev.time + 1,
    }));
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
          </Grid>
        </Column>
      </Column>
    </Grid>
  );
};

export default PubSub;
