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
import RequestResponseIndex from './index';
import useStore from './store';

vi.mock('../../Map/Requestor.node', () => ({
  default: () => <div data-testid="requestor-node" />,
}));
vi.mock('../../Map/Responder.node', () => ({
  default: () => <div data-testid="responder-node" />,
}));
vi.mock('../../Map/Queue.node', () => ({
  default: () => <div data-testid="queue-node" />,
}));
vi.mock('../../Map/Custom.edge', () => ({
  default: () => null,
}));

describe('RequestResponse pattern', () => {
  beforeEach(() => {
    useStore.setState(useStore.getInitialState());
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1280,
    });
  });

  it('renders the flow canvas with the sidebar', () => {
    const { container } = render(<RequestResponseIndex />);

    expect(container.querySelector('.flow-container')).toBeInTheDocument();
    expect(container.querySelector('.reactflow-wrapper')).toBeInTheDocument();
    expect(screen.getByText('Add elements')).toBeInTheDocument();
  });

  it('renders the initial requestor, responder and queue', () => {
    render(<RequestResponseIndex />);

    expect(screen.getByTestId('requestor-node')).toBeInTheDocument();
    expect(screen.getByTestId('responder-node')).toBeInTheDocument();
    expect(screen.getAllByTestId('queue-node')).toHaveLength(1);
  });

  it('shows the Request/Response sidebar items and instruction', () => {
    render(<RequestResponseIndex />);

    expect(screen.getByText('Requestor app')).toBeInTheDocument();
    expect(screen.getByText('Responder app')).toBeInTheDocument();
    expect(
      screen.getByText(/a temporary reply queue is auto-created/)
    ).toBeInTheDocument();
  });
});
