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
import Sidebar from './Sidebar';

const setWidth = (width: number) => {
  window.innerWidth = width;
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

const openPanel = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /how it works/i }));
  return user;
};

describe('PointToPoint Sidebar', () => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    window.innerWidth = 1200;
  });

  afterEach(() => {
    window.innerWidth = originalWidth;
  });

  describe('elements', () => {
    it.each([
      ['Producer app', 'Sends messages to a queue'],
      ['Queue', 'Buffers and routes messages'],
      ['Consumer app', 'Receives messages from queue'],
    ])('offers the %s card', (label, description) => {
      render(<Sidebar />);

      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('lists the cards in the order producer, queue, consumer', () => {
      render(<Sidebar />);

      const labels = Array.from(
        document.querySelectorAll('.pattern-sidebar__card-label')
      ).map((el) => el.textContent);

      expect(labels).toEqual(['Producer app', 'Queue', 'Consumer app']);
    });

    it.each([
      ['Producer app', 'producer'],
      ['Queue', 'queue'],
      ['Consumer app', 'consumer'],
    ])('drags the %s card as a "%s" node', (label, nodeType) => {
      render(<Sidebar />);
      const card = screen.getByText(label).closest('.pattern-sidebar__card');
      const setData = vi.fn();

      fireEvent.dragStart(card as Element, {
        dataTransfer: { setData, effectAllowed: '' },
      });

      expect(card).toHaveAttribute('draggable', 'true');
      expect(setData).toHaveBeenCalledWith('application/reactflow', nodeType);
    });

    it('shows the instruction for using the canvas', () => {
      render(<Sidebar />);

      expect(
        screen.getByText(/Drag onto canvas\. Connect handles\./)
      ).toBeInTheDocument();
    });
  });

  describe('screen width', () => {
    it('is hidden on a narrow screen', () => {
      window.innerWidth = 999;

      render(<Sidebar />);

      expect(screen.queryByText('Add elements')).not.toBeInTheDocument();
    });

    it('is shown from 1000px', () => {
      window.innerWidth = 1000;

      render(<Sidebar />);

      expect(screen.getByText('Add elements')).toBeInTheDocument();
    });

    it('follows the window being resized', () => {
      render(<Sidebar />);

      setWidth(500);
      expect(screen.queryByText('Add elements')).not.toBeInTheDocument();

      setWidth(1400);
      expect(screen.getByText('Add elements')).toBeInTheDocument();
    });
  });

  describe('how it works', () => {
    it('is closed at first', () => {
      render(<Sidebar />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /how it works/i })
      ).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens a dialog named after the pattern', async () => {
      render(<Sidebar />);

      await openPanel();

      expect(
        screen.getByRole('dialog', { name: 'How it works: point-to-point' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /how it works/i })
      ).toHaveAttribute('aria-expanded', 'true');
    });

    it('renders the dialog in document.body, outside the sidebar', async () => {
      const { container } = render(<Sidebar />);

      await openPanel();

      const dialog = screen.getByRole('dialog');
      expect(container).not.toContainElement(dialog);
      expect(document.body).toContainElement(dialog);
    });

    it('shows the tags, the description and the numbered steps', async () => {
      render(<Sidebar />);

      await openPanel();

      const dialog = screen.getByRole('dialog');
      ['REST', 'AMQP', 'JMS', 'Jakarta Msg 3.0'].forEach((tag) =>
        expect(within(dialog).getByText(tag)).toBeInTheDocument()
      );
      expect(
        within(dialog).getByText(/Point-to-point messaging allows/)
      ).toBeInTheDocument();
      const steps = within(dialog).getAllByRole('listitem');
      expect(steps).toHaveLength(4);
      expect(steps[0]).toHaveTextContent(
        '1Messages are put to queue by a producer application'
      );
      expect(steps[3]).toHaveTextContent(
        '4Optionally, applications may browse messages, leaving them on the queue'
      );
    });

    it('closes with the Close button', async () => {
      render(<Sidebar />);
      const user = await openPanel();

      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Close',
        })
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes when the button is pressed again', async () => {
      render(<Sidebar />);
      const user = await openPanel();

      await user.click(screen.getByRole('button', { name: /how it works/i }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes when its tab panel gets hidden', async () => {
      render(
        <div role="tabpanel">
          <Sidebar />
        </div>
      );
      await openPanel();
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await act(async () => {
        screen.getByRole('tabpanel', { hidden: true }).hidden = true;
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
