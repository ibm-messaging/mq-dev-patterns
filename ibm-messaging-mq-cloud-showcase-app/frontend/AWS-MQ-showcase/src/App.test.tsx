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

import { screen } from '@testing-library/react';
import { renderWithRouter } from './test/utils';
import App from './App';

vi.mock('./content/LandingPage', () => ({
  default: () => <h1>landing page stub</h1>,
}));

describe('App', () => {
  it('renders the header and the landing page on the root route', () => {
    renderWithRouter(<App />, '/');

    expect(
      screen.getByRole('banner', { name: 'IBM MQ showcase' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'landing page stub' })
    ).toBeInTheDocument();
  });

  it('puts the page content in the main landmark', () => {
    renderWithRouter(<App />, '/');

    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('heading', { name: 'landing page stub' })
    );
  });

  it('renders no page content for an unknown route', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWithRouter(<App />, '/does-not-exist');

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('No routes matched location')
    );
    warn.mockRestore();

    expect(
      screen.queryByRole('heading', { name: 'landing page stub' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('banner', { name: 'IBM MQ showcase' })
    ).toBeInTheDocument();
  });

  it('mounts the toast container for notifications', () => {
    const { container } = renderWithRouter(<App />, '/');

    expect(container.querySelector('.Toastify')).toBeInTheDocument();
  });
});
