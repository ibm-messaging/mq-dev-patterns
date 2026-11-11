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

import { render } from '@testing-library/react';
import QueueVisualizer from './QueueVisualizer';

const filledSlots = (container: HTMLElement) =>
  container.querySelectorAll('.queue-visualizer__slot--filled').length;

describe('QueueVisualizer', () => {
  it('renders 10 slots, none filled for an empty queue', () => {
    const { container } = render(<QueueVisualizer />);

    expect(container.querySelectorAll('.queue-visualizer__slot')).toHaveLength(
      10
    );
    expect(filledSlots(container)).toBe(0);
  });

  it('is decorative and uses the size prop', () => {
    const { container } = render(<QueueVisualizer size={80} />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('width', '80');
    expect(svg).toHaveAttribute('height', '80');
  });

  it('fills one slot per message already on the queue', () => {
    const { container } = render(<QueueVisualizer depth={3} />);

    expect(filledSlots(container)).toBe(3);
  });

  it('caps the filled slots at 10', () => {
    const { container } = render(<QueueVisualizer depth={50} />);

    expect(filledSlots(container)).toBe(10);
  });

  it('adds a slot when landCount increases', () => {
    const { container, rerender } = render(<QueueVisualizer landCount={0} />);

    rerender(<QueueVisualizer landCount={2} />);

    expect(filledSlots(container)).toBe(2);
  });

  it('never grows past 10 slots when many messages land', () => {
    const { container, rerender } = render(<QueueVisualizer landCount={0} />);

    rerender(<QueueVisualizer landCount={25} />);

    expect(filledSlots(container)).toBe(10);
  });

  it('removes slots when the visual depth drains', () => {
    const { container, rerender } = render(
      <QueueVisualizer depth={4} vizDepth={4} />
    );

    rerender(<QueueVisualizer depth={4} vizDepth={1} />);

    expect(filledSlots(container)).toBe(1);
  });

  it('keeps slots when the visual depth grows', () => {
    const { container, rerender } = render(
      <QueueVisualizer depth={2} vizDepth={2} />
    );

    rerender(<QueueVisualizer depth={2} vizDepth={5} />);

    expect(filledSlots(container)).toBe(2);
  });
});
