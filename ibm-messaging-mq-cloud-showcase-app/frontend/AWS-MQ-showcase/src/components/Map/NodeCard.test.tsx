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
import NodeCard from './NodeCard';

describe('NodeCard', () => {
  it('renders the title and children', () => {
    render(
      <NodeCard title="Producer app">
        <p>card body</p>
      </NodeCard>
    );

    expect(screen.getByText('Producer app')).toBeInTheDocument();
    expect(screen.getByText('card body')).toBeInTheDocument();
  });

  it('renders the icon and header action when provided', () => {
    render(
      <NodeCard
        title="Consumer app"
        icon={<svg data-testid="icon" />}
        headerAction={<button>Toggle</button>}
      />
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toggle' })).toBeInTheDocument();
  });

  it('colours the icon when iconColor is provided', () => {
    const { container } = render(
      <NodeCard title="Queue" icon={<svg />} iconColor="rgb(10, 20, 30)" />
    );

    expect(container.querySelector('.node-card__header-icon')).toHaveStyle({
      color: 'rgb(10, 20, 30)',
    });
  });

  it('omits the delete button when onDelete is not given', () => {
    render(<NodeCard title="Queue" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onDelete from an accessibly named delete button', async () => {
    const onDelete = vi.fn();
    render(<NodeCard title="Producer app" onDelete={onDelete} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete Producer app' })
    );

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('applies header colours and an extra class name', () => {
    const { container } = render(
      <NodeCard
        title="Styled"
        headerBg="rgb(1, 2, 3)"
        titleColor="rgb(4, 5, 6)"
        className="blob"
      />
    );

    expect(container.firstElementChild).toHaveClass('node-card', 'blob');
    expect(container.querySelector('.node-card__header')).toHaveStyle({
      backgroundColor: 'rgb(1, 2, 3)',
    });
    expect(screen.getByText('Styled')).toHaveStyle({ color: 'rgb(4, 5, 6)' });
  });
});
