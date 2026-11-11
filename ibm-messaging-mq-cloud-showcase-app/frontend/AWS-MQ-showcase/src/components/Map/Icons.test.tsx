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
import AppIcon from './AppIcon';
import QueueIcon from './QueueIcon';

describe.each([
  ['AppIcon', AppIcon, 26],
  ['QueueIcon', QueueIcon, 40],
])('%s', (_name, Icon, defaultSize) => {
  it(`renders a decorative ${defaultSize}px SVG by default`, () => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', String(defaultSize));
    expect(svg).toHaveAttribute('height', String(defaultSize));
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('honours the size prop', () => {
    const { container } = render(<Icon size={12} />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', '12');
    expect(svg).toHaveAttribute('height', '12');
  });
});
