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
import { renderWithRouter } from '../../test/utils';
import TutorialHeader from './TutorialHeader';

describe('TutorialHeader', () => {
  it('renders a banner labelled for the showcase', () => {
    renderWithRouter(<TutorialHeader />);

    expect(
      screen.getByRole('banner', { name: 'IBM MQ showcase' })
    ).toBeInTheDocument();
  });

  it('links the product name back to the home route', () => {
    renderWithRouter(<TutorialHeader />, '/somewhere');

    const home = screen.getByRole('link', { name: /IBM MQ\s*showcase/ });

    expect(home).toHaveAttribute('href', '/');
  });

  it('links to the MQ product page and the GitHub repository', () => {
    renderWithRouter(<TutorialHeader />);

    expect(
      screen.getByRole('link', { name: 'Getting started' })
    ).toHaveAttribute('href', 'https://www.ibm.com/uk-en/products/mq');
    expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute(
      'href',
      'https://github.com/ibm-messaging/mq-dev-patterns.git'
    );
  });

  it('labels both navigation regions', () => {
    renderWithRouter(<TutorialHeader />);

    expect(
      screen.getByRole('navigation', { name: 'Getting started links' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Repository links' })
    ).toBeInTheDocument();
  });

  it('offers a skip-to-content link', () => {
    renderWithRouter(<TutorialHeader />);

    expect(
      screen.getByRole('link', { name: /skip to main content/i })
    ).toBeInTheDocument();
  });
});
