/**
 * Copyright 2022, 2026 IBM Corp.
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

/**
 * UI constants for Map node and edge components: colours, header tokens, and
 * edge style presets. All Carbon token imports are centralised here so that
 * utils.ts holds only reusable logic.
 */

import {
  green10,
  blue10,
  blue60Hover,
  gray70,
  gray100,
  gray50,
  white,
} from '@carbon/colors';
import {
  layer01,
  borderSubtle01,
  supportSuccess,
  interactive,
} from '@carbon/themes';

/**
 * Header background and border colours for node cards.
 * ACTIVE / IDLE: used by Consumer and Responder (state-dependent).
 * BLUE: used by Producer, Publisher and Requestor (always blue).
 */
export const NODE_HEADER_COLORS = {
  HEADER_BG_ACTIVE: green10,
  HEADER_BORDER_ACTIVE: supportSuccess,
  HEADER_BG_IDLE: layer01,
  HEADER_BORDER_IDLE: borderSubtle01,
  HEADER_BG_BLUE: blue10,
  HEADER_BORDER_BLUE: interactive,
} as const;

/**
 * Colours used on React Flow node handles.
 * CONNECTED: handle is locked to a queue.
 * PRODUCER_IDLE: source handle waiting for a connection (producer/requestor side).
 * CONSUMER_IDLE: target handle waiting for a connection (consumer/responder/subscriber side).
 */
export const HANDLE_COLORS = {
  CONNECTED: '#555',
  PRODUCER_IDLE: blue60Hover,
  CONSUMER_IDLE: 'orange',
} as const;

/**
 * Colours for the Subscriber node header.
 * No matching Carbon tokens exist for these values; kept as named constants.
 */
export const SUBSCRIBER_COLORS = {
  HEADER_BG: '#defbe6',
  HEADER_BORDER: '#24a148',
  HEADER_BG_SUBSCRIBED: '#a7f0ba',
} as const;

/**
 * Colours for the Queue node.
 * HEADER: dark header background and border (gray100).
 * ICON: icon and title colour on dark header (white).
 * IDLE_ICON: icon colour when Responder is idle (gray50).
 */
export const QUEUE_COLORS = {
  HEADER: gray100,
  ICON: white,
  IDLE_ICON: gray50,
} as const;

/**
 * Colours for inline text labels in the Producer node toggle row.
 * AUTO_SEND_LABEL: muted "Auto send" label (gray70).
 * TOGGLE_STATE_LABEL: active "On / Off" label (gray100).
 */
export const PRODUCER_COLORS = {
  AUTO_SEND_LABEL: gray70,
  TOGGLE_STATE_LABEL: gray100,
} as const;

/** Default 1px edge style for connections between flow nodes. */
export const EDGE_STYLE_THIN = { stroke: blue60Hover, strokeWidth: 1 };

/**
 * Colours used in Carbon Charts threshold lines.
 * THRESHOLD: queue-depth threshold marker colour. CSS 'orange' (#ffa500);
 * no Carbon token matches this exact value.
 */
export const CHART_COLORS = {
  THRESHOLD: '#ffa500',
} as const;
