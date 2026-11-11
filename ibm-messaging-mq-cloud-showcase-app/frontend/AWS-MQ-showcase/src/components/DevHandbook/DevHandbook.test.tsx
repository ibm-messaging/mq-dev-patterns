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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DevHandbook from './DevHandbook';

// Carbon's SidePanel only unmounts after a CSS animation ends, and jsdom never
// fires that event. The panel is therefore asserted by its open/closing state
// class rather than by DOM removal.
const panel = () => document.querySelector('.dev-handbook');
const isOpen = () => !!panel()?.classList.contains('c4p--side-panel--open');

describe('DevHandbook', () => {
  it('renders only the launcher button until it is pressed', () => {
    render(<DevHandbook />);

    expect(
      screen.getByRole('button', { name: 'Dev handbook' })
    ).toBeInTheDocument();
    expect(panel()).not.toBeInTheDocument();
    expect(screen.queryByText('MQ concepts glossary')).not.toBeInTheDocument();
  });

  it('opens the side panel with its title, subtitle and content', async () => {
    render(<DevHandbook />);

    await userEvent.click(screen.getByRole('button', { name: 'Dev handbook' }));

    expect(
      await screen.findByRole('heading', { name: 'Dev handbook' })
    ).toBeVisible();
    expect(
      screen.getByText(/How the IBM MQ Messaging Playground works/)
    ).toBeVisible();
    expect(screen.getByText('MQ concepts glossary')).toBeVisible();
    expect(screen.getByText('How this playground works')).toBeVisible();
    expect(isOpen()).toBe(true);
  });

  it('shows an overlay behind the panel', async () => {
    render(<DevHandbook />);

    await userEvent.click(screen.getByRole('button', { name: 'Dev handbook' }));
    await screen.findByText('MQ concepts glossary');

    expect(document.querySelector('.c4p--side-panel__overlay')).toBeTruthy();
  });

  it('closes the panel with its close button', async () => {
    render(<DevHandbook />);
    await userEvent.click(screen.getByRole('button', { name: 'Dev handbook' }));
    await screen.findByText('MQ concepts glossary');

    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    await vi.waitFor(() => expect(isOpen()).toBe(false));
    expect(panel()).toHaveClass('c4p--side-panel--closing');
  });

  it('closes the panel with the Escape key', async () => {
    render(<DevHandbook />);
    await userEvent.click(screen.getByRole('button', { name: 'Dev handbook' }));
    await screen.findByText('MQ concepts glossary');

    await userEvent.keyboard('{Escape}');

    await vi.waitFor(() => expect(isOpen()).toBe(false));
  });

  it('can be reopened after closing', async () => {
    render(<DevHandbook />);
    const launcher = screen.getByRole('button', { name: 'Dev handbook' });
    await userEvent.click(launcher);
    await screen.findByText('MQ concepts glossary');
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(isOpen()).toBe(false));

    await userEvent.click(launcher);

    await vi.waitFor(() => expect(isOpen()).toBe(true));
  });
});
