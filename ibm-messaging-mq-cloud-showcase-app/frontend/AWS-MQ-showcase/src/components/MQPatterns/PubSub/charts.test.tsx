/**
 * Copyright 2026 IBM Corp.
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

// Tests the two charts (PubSub/chart1.tsx and chart2.tsx). It checks that Chart1
// (line) and Chart2 (bar) show nothing without data. It checks the data and axes
// they pass on, and the max values. The charts library is mocked.

import { render, screen } from '@testing-library/react';
import Chart1 from './chart1';
import Chart2 from './chart2';

const charts = vi.hoisted(() => ({ line: vi.fn(), bar: vi.fn() }));

vi.mock('@carbon/charts-react', () => ({
  LineChart: (props: unknown) => {
    charts.line(props);
    return <div data-testid="line-chart" />;
  },
  GroupedBarChart: (props: unknown) => {
    charts.bar(props);
    return <div data-testid="bar-chart" />;
  },
}));

describe('PubSub charts', () => {
  afterEach(() => vi.clearAllMocks());

  describe('Chart1 (line)', () => {
    it('renders nothing without data', () => {
      const { container } = render(<Chart1 data={[]} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('passes the data and the subscriber axes to the line chart', () => {
      const data = [{ group: 'tickets/classic', time: 1, value: 2 }];

      render(<Chart1 data={data} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      const { data: received, options } = charts.line.mock.calls[0][0];
      expect(received).toBe(data);
      expect(options.axes.bottom).toMatchObject({ mapsTo: 'time' });
      expect(options.axes.left).toMatchObject({
        mapsTo: 'value',
        title: 'Subscribers depth',
      });
    });

    it('marks the max number of subscribers per topic', () => {
      render(<Chart1 data={[{ group: 'T', time: 1, value: 0 }]} />);

      const { options } = charts.line.mock.calls[0][0];
      expect(options.axes.left.thresholds[0]).toMatchObject({
        value: 5,
        label: 'Max number of subscribers per topic',
      });
    });
  });

  describe('Chart2 (bar)', () => {
    it('renders nothing without data', () => {
      const { container } = render(<Chart2 data={[]} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('passes the data and the axes to the bar chart', () => {
      const data = [{ group: 'TOPIC T', key: 'T', value: 3 }];

      render(<Chart2 data={data} />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      const { data: received, options } = charts.bar.mock.calls[0][0];
      expect(received).toBe(data);
      expect(options.axes.bottom).toMatchObject({
        mapsTo: 'key',
        title: 'Subscribers',
      });
      expect(options.axes.left).toMatchObject({ mapsTo: 'value' });
    });

    it('marks the max depth of 5000', () => {
      render(<Chart2 data={[{ group: 'TOPIC T', key: 'T', value: 0 }]} />);

      const { options } = charts.bar.mock.calls[0][0];
      expect(options.axes.left.thresholds[0]).toMatchObject({
        value: 5000,
        label: 'Max depth',
      });
    });
  });
});
