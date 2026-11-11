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
import userEvent from '@testing-library/user-event';
import { Position } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import CustomEdge from './Custom.edge';
import useStore from '../MQPatterns/PointToPoint/store';

const EDGE_ID = '1-3';

const edgeProps = (id = EDGE_ID) =>
  ({
    id,
    source: '1',
    target: '3',
    sourceX: 0,
    sourceY: 0,
    targetX: 200,
    targetY: 100,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: { stroke: 'red' },
  }) as EdgeProps;

const renderEdge = (id = EDGE_ID) =>
  render(
    <svg>
      <CustomEdge {...edgeProps(id)} />
    </svg>
  );

const sendMessage = (edgeId: string, id = 'm1', reverse?: boolean) =>
  act(() => {
    window.dispatchEvent(
      new CustomEvent('mq-message-flow', {
        detail: { edgeId, id, ...(reverse && { reverse }) },
      })
    );
  });

const particles = (container: HTMLElement) =>
  container.querySelectorAll('g > rect');

describe('CustomEdge', () => {
  beforeEach(() => {
    useStore.setState(useStore.getInitialState(), true);
    // jsdom has no SVG geometry, the particle animation needs these.
    Object.assign(SVGElement.prototype, {
      getTotalLength: () => 100,
      getPointAtLength: (d: number) => ({ x: d, y: 0 }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(SVGElement.prototype, 'getTotalLength');
    Reflect.deleteProperty(SVGElement.prototype, 'getPointAtLength');
  });

  describe('path', () => {
    it('draws a bezier path between the two handles', () => {
      const { container } = renderEdge();

      const path = container.querySelector('path');
      expect(path).toHaveAttribute('id', `edge-path-${EDGE_ID}`);
      expect(path).toHaveClass('react-flow__edge-path');
      expect(path?.getAttribute('d')).toMatch(/^M\s?0,0\s?C/);
    });

    it('applies the style it is given', () => {
      const { container } = renderEdge();

      expect(container.querySelector('path')?.getAttribute('style')).toContain(
        'stroke: red'
      );
    });
  });

  describe('delete button', () => {
    it('removes the edge from the store when clicked', async () => {
      const user = userEvent.setup();
      renderEdge();
      expect(useStore.getState().edges.some((e) => e.id === EDGE_ID)).toBe(
        true
      );

      await user.click(screen.getByRole('button', { name: 'X' }));

      expect(useStore.getState().edges.some((e) => e.id === EDGE_ID)).toBe(
        false
      );
    });

    it('does not let the click reach the elements behind it', async () => {
      const user = userEvent.setup();
      const onParentClick = vi.fn();
      render(
        <svg onClick={onParentClick}>
          <CustomEdge {...edgeProps()} />
        </svg>
      );

      await user.click(screen.getByRole('button', { name: 'X' }));

      expect(onParentClick).not.toHaveBeenCalled();
    });
  });

  describe('message particles', () => {
    it('shows no particle until a message flows', () => {
      const { container } = renderEdge();

      expect(particles(container)).toHaveLength(0);
    });

    it('adds a particle when a message flows on this edge', () => {
      const { container } = renderEdge();

      sendMessage(EDGE_ID);

      expect(particles(container)).toHaveLength(1);
    });

    it('ignores messages flowing on other edges', () => {
      const { container } = renderEdge();

      sendMessage('3-2');

      expect(particles(container)).toHaveLength(0);
    });

    it('shows one particle per message', () => {
      const { container } = renderEdge();

      sendMessage(EDGE_ID, 'a');
      sendMessage(EDGE_ID, 'b');

      expect(particles(container)).toHaveLength(2);
    });

    it('removes a particle once its animation is over', () => {
      vi.useFakeTimers();
      const { container } = renderEdge();
      sendMessage(EDGE_ID);

      act(() => vi.advanceTimersByTime(1049));
      expect(particles(container)).toHaveLength(1);

      act(() => vi.advanceTimersByTime(1));
      expect(particles(container)).toHaveLength(0);
    });

    it('moves the particle along the path', () => {
      vi.useFakeTimers();
      const { container } = renderEdge();
      sendMessage(EDGE_ID);

      act(() => vi.advanceTimersByTime(1000));

      const group =
        container.querySelector('g > rect')?.parentElement?.parentElement;
      expect(group?.getAttribute('transform')).toMatch(/^translate\(/);
    });

    it('starts at the end of the path for a reverse message', () => {
      vi.useFakeTimers();
      const { container } = renderEdge();
      sendMessage(EDGE_ID, 'm1', true);

      act(() => vi.advanceTimersByTime(40));

      const group =
        container.querySelector('g > rect')?.parentElement?.parentElement;
      const x = Number(
        /translate\(([\d.]+),/.exec(group?.getAttribute('transform') ?? '')?.[1]
      );
      expect(x).toBeGreaterThan(90);
    });

    it('stops listening when it is unmounted', () => {
      const remove = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderEdge();

      unmount();

      expect(remove).toHaveBeenCalledWith(
        'mq-message-flow',
        expect.any(Function)
      );
    });
  });
});
