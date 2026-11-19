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

// Tests the publish-subscribe page (PubSub/index.tsx). It checks that the page
// shows the canvas. It checks that the chart of subscribers per topic is drawn
// when the page loads. It checks that a new time step is added every 10 seconds
// and that the earlier ones are kept. It checks that the timer stops on unmount.
// The canvas and the charts library are mocked.

import { act, render, screen } from '@testing-library/react';
import PubSubIndex from './index';
import useStore from './store';

vi.mock('./map', () => ({ default: () => <div data-testid="flow" /> }));

vi.mock('@carbon/charts-react', () => ({
  LineChart: ({ data }: { data: unknown }) => (
    <div data-testid="line-chart">{JSON.stringify(data)}</div>
  ),
}));

const chartData = () =>
  JSON.parse(screen.getByTestId('line-chart').textContent ?? '[]');

const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('PubSub index', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useStore.setState(useStore.getInitialState(), true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the flow', () => {
    render(<PubSubIndex />);

    expect(screen.getByTestId('flow')).toBeInTheDocument();
  });

  describe('on mount', () => {
    it('draws the number of subscribers per topic straight away', () => {
      render(<PubSubIndex />);

      expect(chartData()).toEqual([
        { group: 'tickets/classic', time: 1, value: 2 },
        { group: 'tickets/VIP', time: 1, value: 1 },
        { group: 'tickets/#', time: 1, value: 1 },
      ]);
    });

    it('draws no chart when the canvas has no topic', () => {
      useStore.setState({ nodes: [], edges: [] });

      render(<PubSubIndex />);

      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('10 s interval', () => {
    it('does not fire before 10 s have passed', () => {
      render(<PubSubIndex />);
      act(() => useStore.getState().onDeleteNode('4'));

      tick(9999);

      expect(chartData()[0].value).toBe(2);
    });

    // Deleting subscriber '4' leaves the classic topic with 1 subscriber, not 2.
    it('reads the subscribers of the topics again', () => {
      render(<PubSubIndex />);
      act(() => useStore.getState().onDeleteNode('4'));

      tick(10000);

      expect(chartData()).toContainEqual({
        group: 'tickets/classic',
        time: 2,
        value: 1,
      });
    });

    it('adds a new time step on every tick', () => {
      render(<PubSubIndex />);

      tick(10000);
      tick(10000);

      expect(chartData().map((e: { time: number }) => e.time)).toContain(3);
    });

    // 30 s is 3 ticks. Time steps 1 to 4 with 3 topics each make 12 points.
    it('keeps the earlier time steps when a new one is added', () => {
      render(<PubSubIndex />);
      act(() => useStore.getState().onDeleteNode('4'));

      tick(30000);

      const times = chartData().map((e: { time: number }) => e.time);
      expect([...new Set(times)]).toEqual([1, 2, 3, 4]);
      expect(chartData()).toHaveLength(12);
      expect(chartData()[0]).toEqual({
        group: 'tickets/classic',
        time: 1,
        value: 2,
      });
    });
  });

  it('stops the interval when it is unmounted', () => {
    const { unmount } = render(<PubSubIndex />);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
