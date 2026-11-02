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

import { GroupedBarChart } from '@carbon/charts-react';
import '@carbon/charts/styles.css';
import '../shared/chart.scss';
import { ScaleTypes } from '@carbon/charts';
import type { BarChartOptions } from '@carbon/charts';
import type { BarChartEntry } from '../../../types';
import { CHART_COLORS } from '../../../utils/colors';

const DEFAULTOPTION: BarChartOptions = {
  title: 'Queue Manager 1',
  axes: {
    left: {
      mapsTo: 'value',
      title: 'Queues depth',
      thresholds: [
        {
          value: 5000,
          label: 'Max depth',
          fillColor: CHART_COLORS.THRESHOLD,
        },
      ],
    },
    bottom: {
      scaleType: ScaleTypes.LABELS,
      mapsTo: 'key',
      title: 'Queues',
    },
  },
  height: '400px',
};

interface Props {
  data: BarChartEntry[];
}

const Chart2 = ({ data }: Props) => {
  if (!data.length) return null;
  return <GroupedBarChart data={data} options={DEFAULTOPTION} />;
};

export default Chart2;
