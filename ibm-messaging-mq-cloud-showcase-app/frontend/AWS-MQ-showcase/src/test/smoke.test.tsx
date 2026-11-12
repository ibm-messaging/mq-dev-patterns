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

import { Button } from '@carbon/react';
import { Link } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { renderWithRouter } from './utils';

describe('test environment', () => {
  it('renders a Carbon component and handles user events', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Click me' }));

    expect(screen.getByRole('button', { name: 'Click me' })).toBeEnabled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders router components through renderWithRouter', () => {
    renderWithRouter(<Link to="/">Home</Link>);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/'
    );
  });
});
