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

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PatternSidebar from './PatternSidebar';
import type { HowItWorks, PatternSidebarItem } from '../../types';

const ITEMS: PatternSidebarItem[] = [
  {
    nodeType: 'producer',
    icon: <span>P</span>,
    label: 'Producer app',
    description: 'Sends messages to a queue',
  },
  {
    nodeType: 'queue',
    icon: <span>Q</span>,
    label: 'Queue',
    description: 'Buffers and routes messages',
  },
];

const HOW_IT_WORKS: HowItWorks = {
  patternName: 'point-to-point',
  tags: ['REST', 'AMQP'],
  description: 'Applications communicate asynchronously.',
  steps: ['Put a message', 'Store the message', 'Get the message'],
};

const setWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
};

describe('PatternSidebar', () => {
  beforeEach(() => setWidth(1280));
  afterEach(() => setWidth(1024));

  it('lists each draggable element with its label and description', () => {
    render(<PatternSidebar items={ITEMS} />);

    expect(screen.getByText('Add elements')).toBeInTheDocument();
    expect(screen.getByText('Producer app')).toBeInTheDocument();
    expect(screen.getByText('Sends messages to a queue')).toBeInTheDocument();
    expect(screen.getByText('Queue')).toBeInTheDocument();
    expect(screen.getByText('Buffers and routes messages')).toBeInTheDocument();
  });

  it('shows the default instruction, or a custom one', () => {
    const { rerender } = render(<PatternSidebar items={ITEMS} />);
    expect(
      screen.getByText(/Drag onto canvas\. Connect handles\./)
    ).toBeInTheDocument();

    rerender(<PatternSidebar items={ITEMS} instruction="Custom hint" />);
    expect(screen.getByText('Custom hint')).toBeInTheDocument();
  });

  it('stores the node type on drag start', () => {
    render(<PatternSidebar items={ITEMS} />);
    const card = screen.getByText('Producer app').closest('[draggable]');
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' };

    fireEvent.dragStart(card as Element, { dataTransfer });

    expect(card).toHaveAttribute('draggable', 'true');
    expect(dataTransfer.setData).toHaveBeenCalledWith(
      'application/reactflow',
      'producer'
    );
    expect(dataTransfer.effectAllowed).toBe('move');
  });

  it('renders nothing on narrow screens', () => {
    setWidth(800);

    const { container } = render(
      <PatternSidebar items={ITEMS} howItWorks={HOW_IT_WORKS} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('reacts to window resize', () => {
    const { container } = render(<PatternSidebar items={ITEMS} />);
    expect(container).not.toBeEmptyDOMElement();

    act(() => {
      setWidth(500);
      window.dispatchEvent(new Event('resize'));
    });
    expect(container).toBeEmptyDOMElement();

    act(() => {
      setWidth(1400);
      window.dispatchEvent(new Event('resize'));
    });
    expect(container).not.toBeEmptyDOMElement();
  });

  it('has no "How it works" button without howItWorks content', () => {
    render(<PatternSidebar items={ITEMS} />);

    expect(
      screen.queryByRole('button', { name: /how it works/i })
    ).not.toBeInTheDocument();
  });

  describe('How it works panel', () => {
    it('is closed until the button is pressed', () => {
      render(<PatternSidebar items={ITEMS} howItWorks={HOW_IT_WORKS} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /how it works/i })
      ).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens a dialog with the pattern name, tags, description and steps', async () => {
      render(<PatternSidebar items={ITEMS} howItWorks={HOW_IT_WORKS} />);

      await userEvent.click(
        screen.getByRole('button', { name: /how it works/i })
      );

      const dialog = screen.getByRole('dialog', {
        name: 'How it works: point-to-point',
      });
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(
        within(dialog).getByRole('heading', { level: 2 })
      ).toHaveTextContent('Patterns: point-to-point');
      expect(within(dialog).getByText('REST')).toBeInTheDocument();
      expect(within(dialog).getByText('AMQP')).toBeInTheDocument();
      expect(
        within(dialog).getByText('Applications communicate asynchronously.')
      ).toBeInTheDocument();
      const steps = within(dialog).getAllByRole('listitem');
      expect(steps).toHaveLength(3);
      expect(steps[0]).toHaveTextContent('1Put a message');
      expect(steps[2]).toHaveTextContent('3Get the message');
      expect(
        screen.getByRole('button', { name: /how it works/i })
      ).toHaveAttribute('aria-expanded', 'true');
    });

    it('renders the panel in a portal on document.body', async () => {
      const { container } = render(
        <PatternSidebar items={ITEMS} howItWorks={HOW_IT_WORKS} />
      );

      await userEvent.click(
        screen.getByRole('button', { name: /how it works/i })
      );

      expect(within(container).queryByRole('dialog')).not.toBeInTheDocument();
      expect(document.body).toContainElement(screen.getByRole('dialog'));
    });

    it('closes with the Close button', async () => {
      render(<PatternSidebar items={ITEMS} howItWorks={HOW_IT_WORKS} />);
      await userEvent.click(
        screen.getByRole('button', { name: /how it works/i })
      );

      await userEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('toggles closed when the button is pressed again', async () => {
      render(<PatternSidebar items={ITEMS} howItWorks={HOW_IT_WORKS} />);
      const button = screen.getByRole('button', { name: /how it works/i });

      await userEvent.click(button);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      await userEvent.click(button);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('offers a keyboard-operable drag handle with instructions', async () => {
      render(<PatternSidebar items={ITEMS} howItWorks={HOW_IT_WORKS} />);
      await userEvent.click(
        screen.getByRole('button', { name: /how it works/i })
      );

      const handle = screen.getByRole('button', { name: 'Drag panel' });

      expect(handle).toHaveAccessibleDescription(
        /press Enter.*arrow keys.*Press Enter again to drop/s
      );
    });

    it('closes when the tab panel that contains it becomes hidden', async () => {
      render(
        <div role="tabpanel" data-testid="tabpanel">
          <PatternSidebar items={ITEMS} howItWorks={HOW_IT_WORKS} />
        </div>
      );
      await userEvent.click(
        screen.getByRole('button', { name: /how it works/i })
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // MutationObserver callbacks run in a microtask, so flush them in act().
      await act(async () => {
        screen.getByTestId('tabpanel').hidden = true;
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('omits tags and steps sections when they are empty', async () => {
      render(
        <PatternSidebar items={ITEMS} howItWorks={{ patternName: 'minimal' }} />
      );

      await userEvent.click(
        screen.getByRole('button', { name: /how it works/i })
      );

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).queryByRole('list')).not.toBeInTheDocument();
      expect(within(dialog).queryByText('REST')).not.toBeInTheDocument();
    });
  });
});
