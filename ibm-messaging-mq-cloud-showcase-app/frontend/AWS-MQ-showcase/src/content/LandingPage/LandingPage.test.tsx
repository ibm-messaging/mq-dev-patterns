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

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LandingPage from './LandingPage';

// The pattern canvases are covered in their own steps; stub them here so the
// landing page (heading, tabs, lazy loading) is tested in isolation.
vi.mock('../../components/MQPatterns/PointToPoint/index', () => ({
  default: () => <div>point-to-point pattern</div>,
}));
vi.mock('../../components/MQPatterns/PubSub', () => ({
  default: () => <div>publish-subscribe pattern</div>,
}));
vi.mock('../../components/MQPatterns/RequestResponse', () => ({
  default: () => <div>request-response pattern</div>,
}));

const TAB_NAMES = [
  'POINT-TO-POINT',
  'PUBLISHER / SUBSCRIBER',
  'REQUEST / RESPONSE',
];

describe('LandingPage', () => {
  describe('content', () => {
    beforeEach(async () => {
      render(<LandingPage />);
      // Let the lazy first panel resolve so React does not warn about
      // Suspense updates landing outside act().
      await screen.findByText('point-to-point pattern');
    });

    it('shows the page heading and description', () => {
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'IBM MQ messaging patterns',
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Explore how applications communicate/)
      ).toBeInTheDocument();
    });

    it('links to the tutorial in a new tab', () => {
      const link = screen.getByRole('link', { name: 'visit this tutorial' });

      expect(link).toHaveAttribute(
        'href',
        'https://developer.ibm.com/tutorials/mq-build-deploy-ibm-mq-app-to-aws-cloud/'
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('includes the Dev handbook launcher', () => {
      expect(
        screen.getByRole('button', { name: 'Dev handbook' })
      ).toBeInTheDocument();
    });

    it('shows the customer statistics', () => {
      expect(
        screen.getByText('Thousands of businesses worldwide depend on IBM MQ')
      ).toBeInTheDocument();
      expect(
        screen.getByText('90% of the top 100 global banks')
      ).toBeInTheDocument();
      expect(screen.getByText('73% of the Fortune 100')).toBeInTheDocument();
      expect(
        screen.getByText('80% of the top 20 telecommunications companies')
      ).toBeInTheDocument();
    });

    it('shows the benefits', () => {
      expect(
        screen.getByRole('heading', { name: 'Benefits' })
      ).toBeInTheDocument();
      expect(
        screen.getByText('Insulate your business from risks')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Simple multi-style messaging')
      ).toBeInTheDocument();
      expect(
        screen.getByText('24x7x365 technical support')
      ).toBeInTheDocument();
    });
  });

  describe('tabs', () => {
    it('renders the three pattern tabs in a labelled tab list', () => {
      render(<LandingPage />);

      const tabList = screen.getByRole('tablist', {
        name: 'IBM MQ messaging patterns',
      });
      const tabs = within(tabList).getAllByRole('tab');

      expect(tabs.map((t) => t.textContent)).toEqual(TAB_NAMES);
    });

    it('selects point-to-point by default', async () => {
      render(<LandingPage />);

      expect(screen.getByRole('tab', { name: TAB_NAMES[0] })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByRole('tab', { name: TAB_NAMES[1] })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      expect(await screen.findByText('point-to-point pattern')).toBeVisible();
    });

    it('shows the matching panel when a tab is clicked', async () => {
      render(<LandingPage />);

      await userEvent.click(screen.getByRole('tab', { name: TAB_NAMES[1] }));

      expect(screen.getByRole('tab', { name: TAB_NAMES[1] })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(
        await screen.findByText('publish-subscribe pattern')
      ).toBeVisible();
      expect(screen.getByText('point-to-point pattern')).not.toBeVisible();

      await userEvent.click(screen.getByRole('tab', { name: TAB_NAMES[2] }));

      expect(await screen.findByText('request-response pattern')).toBeVisible();
      expect(screen.getByText('publish-subscribe pattern')).not.toBeVisible();
    });

    it('moves between tabs with the arrow keys', async () => {
      render(<LandingPage />);
      const first = screen.getByRole('tab', { name: TAB_NAMES[0] });
      first.focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: TAB_NAMES[1] })).toHaveFocus();

      await userEvent.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: TAB_NAMES[2] })).toHaveFocus();

      await userEvent.keyboard('{ArrowLeft}');
      expect(screen.getByRole('tab', { name: TAB_NAMES[1] })).toHaveFocus();
    });

    it('selects the focused tab with Enter', async () => {
      render(<LandingPage />);
      screen.getByRole('tab', { name: TAB_NAMES[0] }).focus();

      await userEvent.keyboard('{ArrowRight}{Enter}');

      expect(screen.getByRole('tab', { name: TAB_NAMES[1] })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(
        await screen.findByText('publish-subscribe pattern')
      ).toBeVisible();
    });
  });
});
