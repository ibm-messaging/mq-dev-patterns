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

import { act, render, screen } from '@testing-library/react';
import PointPointIndex from './index';
import useStore from './store';
import type { QueueDepth } from '../../../types';

vi.mock('./map', () => ({ default: () => <div data-testid="flow" /> }));

vi.mock('@carbon/charts-react', () => ({
  LineChart: ({ data }: { data: unknown }) => (
    <div data-testid="line-chart">{JSON.stringify(data)}</div>
  ),
  GroupedBarChart: ({ data }: { data: unknown }) => (
    <div data-testid="bar-chart">{JSON.stringify(data)}</div>
  ),
}));

const QUEUE = 'DEV.QUEUE.1';

const chartData = (testId: string) =>
  JSON.parse(screen.getByTestId(testId).textContent ?? '[]');

const publish = (data: QueueDepth[]) =>
  act(() => useStore.getState().updateQueueData(data));

const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('PointToPoint index', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useStore.setState(useStore.getInitialState(), true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('before any queue data', () => {
    it('shows the flow', () => {
      render(<PointPointIndex />);

      expect(screen.getByTestId('flow')).toBeInTheDocument();
    });

    it('shows no chart', () => {
      render(<PointPointIndex />);

      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    it('does not draw anything on the 15 s tick without data', () => {
      render(<PointPointIndex />);

      tick(15000);

      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('first queue data', () => {
    it('draws both charts straight away, without waiting 15 s', () => {
      render(<PointPointIndex />);

      publish([{ name: QUEUE, depth: 3 }]);

      expect(chartData('line-chart')).toEqual([
        { group: QUEUE, time: 1, value: 3 },
      ]);
      expect(chartData('bar-chart')).toEqual([
        { group: `QUEUE ${QUEUE}`, key: QUEUE, value: 3 },
      ]);
    });

    it('turns a depth sent as text into a number', () => {
      render(<PointPointIndex />);

      publish([{ name: QUEUE, depth: '7' as unknown as number }]);

      expect(chartData('bar-chart')[0].value).toBe(7);
    });

    it('leaves out queues that are not on the canvas', () => {
      render(<PointPointIndex />);

      publish([
        { name: QUEUE, depth: 1 },
        { name: 'DEV.QUEUE.3', depth: 9 },
      ]);

      expect(chartData('line-chart')).toHaveLength(1);
      expect(chartData('bar-chart')).toHaveLength(1);
    });
  });

  describe('15 s interval', () => {
    it('adds a point to the line chart for the next time step', () => {
      render(<PointPointIndex />);
      publish([{ name: QUEUE, depth: 3 }]);

      tick(15000);

      expect(chartData('line-chart')).toEqual([
        { group: QUEUE, time: 1, value: 3 },
        { group: QUEUE, time: 2, value: 3 },
      ]);
    });

    it('updates the bar of a queue in place instead of adding another', () => {
      render(<PointPointIndex />);
      publish([{ name: QUEUE, depth: 3 }]);
      publish([{ name: QUEUE, depth: 8 }]);

      tick(15000);

      expect(chartData('bar-chart')).toEqual([
        { group: `QUEUE ${QUEUE}`, key: QUEUE, value: 8 },
      ]);
    });

    it('keeps adding points while queue data arrives every 3 s', () => {
      render(<PointPointIndex />);

      for (let i = 0; i < 20; i++) {
        publish([{ name: QUEUE, depth: i }]);
        tick(3000);
      }

      expect(chartData('line-chart').length).toBeGreaterThan(1);
    });

    it('does not fire before 15 s have passed', () => {
      render(<PointPointIndex />);
      publish([{ name: QUEUE, depth: 3 }]);

      tick(14999);

      expect(chartData('line-chart')).toHaveLength(1);
    });
  });

  describe('queue removed from the canvas', () => {
    it('drops its bar but keeps its history in the line chart', () => {
      render(<PointPointIndex />);
      publish([{ name: QUEUE, depth: 3 }]);
      act(() => useStore.getState().onDeleteNode('3', true));

      publish([{ name: QUEUE, depth: 3 }]);
      tick(15000);

      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
      expect(chartData('line-chart')).toEqual([
        { group: QUEUE, time: 1, value: 3 },
      ]);
    });
  });

  it('stops the interval when it is unmounted', () => {
    const { unmount } = render(<PointPointIndex />);
    publish([{ name: QUEUE, depth: 3 }]);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
