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

import { LineChart } from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts';
import type { LineChartOptions } from '@carbon/charts';
import '@carbon/charts/styles.css';
import { CHART_COLORS } from '../../../utils/colors';
import type { LineChartEntry } from '../../../types';
import '../shared/chart.scss';

interface Chart1Props {
  data: LineChartEntry[];
}

const DEFAULTOPTION: LineChartOptions = {
  title: 'Queue manager 1',
  axes: {
    bottom: {
      title: 'Time',
      mapsTo: 'time',
      scaleType: ScaleTypes.LINEAR,
    },
    left: {
      mapsTo: 'value',
      title: 'Subscribers depth',
      scaleType: ScaleTypes.LINEAR,
      thresholds: [
        {
          value: 5,
          label: 'Max number of subscribers per topic',
          fillColor: CHART_COLORS.THRESHOLD,
        },
      ],
    },
  },
  curve: 'curveMonotoneX',
  height: '400px',
};

const Chart1 = ({ data }: Chart1Props) => {
  if (!data.length) return null;
  return <LineChart data={data} options={DEFAULTOPTION} />;
};

export default Chart1;
