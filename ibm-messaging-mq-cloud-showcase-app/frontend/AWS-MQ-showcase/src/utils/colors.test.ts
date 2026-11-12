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

import {
  CHART_COLORS,
  EDGE_STYLE_THIN,
  HANDLE_COLORS,
  NODE_HEADER_COLORS,
  PRODUCER_COLORS,
  QUEUE_COLORS,
  SUBSCRIBER_COLORS,
} from './colors';

describe('colour constants', () => {
  it('defines a non-empty value for every node header colour', () => {
    expect(Object.keys(NODE_HEADER_COLORS)).toEqual([
      'HEADER_BG_ACTIVE',
      'HEADER_BORDER_ACTIVE',
      'HEADER_BG_IDLE',
      'HEADER_BORDER_IDLE',
      'HEADER_BG_BLUE',
      'HEADER_BORDER_BLUE',
    ]);
    Object.values(NODE_HEADER_COLORS).forEach((value) => {
      expect(value).toBeTruthy();
    });
  });

  it('uses distinct colours for connected and idle handles', () => {
    expect(HANDLE_COLORS.CONNECTED).toBe('#555');
    expect(HANDLE_COLORS.CONSUMER_IDLE).toBe('orange');
    expect(HANDLE_COLORS.PRODUCER_IDLE).not.toBe(HANDLE_COLORS.CONSUMER_IDLE);
  });

  it('exposes the subscriber, queue and producer palettes', () => {
    expect(SUBSCRIBER_COLORS.HEADER_BG).toBe('#defbe6');
    expect(SUBSCRIBER_COLORS.HEADER_BORDER).toBe('#24a148');
    expect(SUBSCRIBER_COLORS.HEADER_BG_SUBSCRIBED).toBe('#a7f0ba');
    expect(Object.keys(QUEUE_COLORS)).toEqual(['HEADER', 'ICON', 'IDLE_ICON']);
    expect(Object.keys(PRODUCER_COLORS)).toEqual([
      'AUTO_SEND_LABEL',
      'TOGGLE_STATE_LABEL',
    ]);
  });

  it('defines a 1px edge style and the chart threshold colour', () => {
    expect(EDGE_STYLE_THIN.strokeWidth).toBe(1);
    expect(EDGE_STYLE_THIN.stroke).toBeTruthy();
    expect(CHART_COLORS.THRESHOLD).toBe('#ffa500');
  });
});
