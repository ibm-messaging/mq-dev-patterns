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

import React from 'react';

const QueueIcon = ({ size = 40 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    aria-hidden="true"
    focusable="false">
    <path
      d="M2.79999 4.80005H8.79999V32.8C8.79999 34.9334 9.86665 36 12 36H28C30.1333 36 31.2 34.9334 31.2 32.8V4.80005H37.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <mask
      id="mask0_1_3248"
      style={{ maskType: 'luminance' }}
      maskUnits="userSpaceOnUse"
      x="11"
      y="8"
      width="18"
      height="26">
      <path d="M29 8.40002H11V33.8H29V8.40002Z" fill="white" />
    </mask>
    <g mask="url(#mask0_1_3248)">
      <path
        d="M26.6 29.6799H13.4C13.0686 29.6799 12.8 29.9486 12.8 30.2799V33.1999C12.8 33.5313 13.0686 33.7999 13.4 33.7999H26.6C26.9314 33.7999 27.2 33.5313 27.2 33.1999V30.2799C27.2 29.9486 26.9314 29.6799 26.6 29.6799Z"
        fill="#3D6BCE"
      />
      <path
        d="M12.8 29.6799L20 32.4609L27.2 29.6799"
        stroke="white"
        strokeWidth="0.88"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26.6 24.36H13.4C13.0686 24.36 12.8 24.6286 12.8 24.96V27.88C12.8 28.2114 13.0686 28.48 13.4 28.48H26.6C26.9314 28.48 27.2 28.2114 27.2 27.88V24.96C27.2 24.6286 26.9314 24.36 26.6 24.36Z"
        fill="#3D6BCE"
      />
      <path
        d="M12.8 24.36L20 27.141L27.2 24.36"
        stroke="white"
        strokeWidth="0.88"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

export default QueueIcon;
