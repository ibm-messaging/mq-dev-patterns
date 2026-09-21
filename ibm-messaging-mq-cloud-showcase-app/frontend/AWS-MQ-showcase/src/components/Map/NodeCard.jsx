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
import { Close } from '@carbon/react/icons';
import './NodeCard.scss';

const NodeCard = ({
  headerBg = '#ffffff',
  headerBorderColor = '#c6c6c6',
  icon,
  iconColor,
  title,
  titleColor = '#161616',
  headerAction,
  onDelete,
  children,
  className = '',
}) => {
  return (
    <div className={`node-card ${className}`.trim()}>
      {onDelete && (
        <button
          className="node-card__close"
          aria-label={`Delete ${title}`}
          onClick={onDelete}>
          <Close size={10} />
        </button>
      )}

      <div
        className="node-card__header"
        style={{
          backgroundColor: headerBg,
          borderBottomColor: headerBorderColor,
        }}>
        {icon && (
          <span
            className="node-card__header-icon"
            style={iconColor ? { color: iconColor } : undefined}>
            {icon}
          </span>
        )}
        <span className="node-card__header-title" style={{ color: titleColor }}>
          {title}
        </span>
        {headerAction && (
          <span className="node-card__header-action">{headerAction}</span>
        )}
      </div>

      <div className="node-card__body">{children}</div>
    </div>
  );
};

export default NodeCard;
