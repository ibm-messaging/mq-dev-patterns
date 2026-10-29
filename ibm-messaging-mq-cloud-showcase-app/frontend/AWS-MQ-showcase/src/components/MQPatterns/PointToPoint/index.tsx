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
import Chart2 from './chart2';
import './index.scss';
import Flow from './map';
import useStore from './store';
import type { LineChartEntry, BarChartEntry, QueueDepth } from '../../../types';

const PointPointIndex = () => {
  const [dataChart1, setDataChart1] = useState<LineChartEntry[]>([]);
  const [dataChart2, setDataChart2] = useState<BarChartEntry[]>([]);
  const [time, setTime] = useState(1);
  const _result = useStore((state) => state.queueData);
  const currentQueues = useStore((state) => state.getQueuesNodes);
  const [initTime, setInitTime] = useState(true);

  const updateChart = (result: QueueDepth[]) => {
    let _dataChart1 = [...dataChart1];
    let _dataChart2 = [...dataChart2];

    result.forEach((queue) => {
      const isOnTheScreen = currentQueues().find(
        (x) => x.data.queueName === queue.name
      );
      const alreadyRenderedChart1 = _dataChart1.find(
        (x) => x.group === queue.name && x.time === time
      );
      const alreadyRenderedChart2 = _dataChart2.find(
        (x) => x.key === queue.name
      );
      const group = queue.name;
      const depth = parseInt(String(queue.depth));

      if (isOnTheScreen && !alreadyRenderedChart1) {
        const entry: LineChartEntry = { group, time, value: depth };
        _dataChart1 = [..._dataChart1, entry];
      }

      if (!isOnTheScreen && alreadyRenderedChart2) {
        _dataChart2 = _dataChart2.filter((x) => x.key !== queue.name);
      } else if (alreadyRenderedChart2) {
        _dataChart2 = _dataChart2.map((e) =>
          e.key === queue.name ? { ...e, value: depth } : e
        );
      } else if (isOnTheScreen) {
        _dataChart2 = [
          ..._dataChart2,
          { group: 'QUEUE ' + group, key: group, value: depth },
        ];
      }
    });

    setDataChart2(_dataChart2);
    setDataChart1(_dataChart1);
    setTime((t) => t + 1);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      updateChart(_result);
    }, 15000);
    return () => clearInterval(interval);
  }, [_result]);

  useEffect(() => {
    if (_result.length && initTime) {
      updateChart(_result);
      setInitTime(false);
    }
  }, [_result]);

  return (
    <Grid condensed>
      <Column md={8} lg={16} sm={4}>
        <div className="flow-container">
          <Flow />
        </div>

        <Column md={8} lg={16} sm={4}>
          <Grid className="chartSection">
            <Column md={7} lg={{ offset: 1 }} sm={3}>
              <Chart1 data={dataChart1} />
            </Column>
            <Column md={8} lg={{ offset: 8 }} sm={3}>
              <Chart2 data={dataChart2} />
            </Column>
          </Grid>
        </Column>
      </Column>
    </Grid>
  );
};

export default PointPointIndex;
