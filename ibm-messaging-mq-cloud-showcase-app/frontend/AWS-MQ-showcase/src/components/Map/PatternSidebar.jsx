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

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button, Tag } from '@carbon/react';
import { Draggable, Information, Close } from '@carbon/icons-react';
import { makeDraggable } from '@carbon/utilities';
import './PatternSidebar.scss';

const TAG_TYPES = ['blue', 'cyan', 'purple', 'teal'];

const PatternSidebar = ({
  items = [],
  instruction = 'Drag onto canvas. Connect handles. Toggle consumer on to start receiving.',
  howItWorks,
}) => {
  const [isBigScreen, setIsBigScreen] = useState(
    () => window.innerWidth >= 1000
  );
  const [isOpen, setIsOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const dialogRef = useRef(null);
  const headerRef = useRef(null);
  const dragRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsBigScreen(window.innerWidth >= 1000);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const aside = btnRef.current?.closest('[role="tabpanel"]');
    if (!aside) return;
    const observer = new MutationObserver(() => {
      if (aside.hidden) setIsOpen(false);
    });
    observer.observe(aside, { attributes: true, attributeFilter: ['hidden'] });
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    if (!dialogRef.current || !headerRef.current || !dragRef.current) return;

    const { cleanup } = makeDraggable({
      el: dialogRef.current,
      dragHandle: headerRef.current,
      focusableDragHandle: dragRef.current,
      dragStep: 8,
      shiftDragStep: 40,
    });

    return cleanup;
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPanelPos({
        top: rect.top - 280,
        left: rect.right + 12,
      });
    }
    setIsOpen(prev => !prev);
  };

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  if (!isBigScreen) return null;

  const panel =
    isOpen && howItWorks
      ? createPortal(
          <div
            ref={dialogRef}
            className="hiw-panel cds--g100"
            style={{
              top: panelPos.top,
              left: panelPos.left,
            }}
            role="dialog"
            aria-modal="true"
            aria-label={`How it works: ${howItWorks.patternName}`}>
            <div className="hiw-panel__inner cds--popover-content">
              <header ref={headerRef} className="hiw-panel__header">
                <span id="hiw-drag-instructions" className="hiw-panel__sr-only">
                  To pick up this panel, press Enter. While dragging, use the
                  arrow keys to move it. Press Enter again to drop.
                </span>
                <Button
                  kind="ghost"
                  size="sm"
                  ref={dragRef}
                  className="hiw-panel__drag-btn"
                  aria-describedby="hiw-drag-instructions"
                  hasIconOnly
                  iconDescription="Drag panel"
                  renderIcon={Draggable}
                />
                <h2 className="hiw-panel__title">
                  Patterns:{' '}
                  <span className="hiw-panel__title-accent">
                    {howItWorks.patternName}
                  </span>
                </h2>
                <Button
                  kind="ghost"
                  size="sm"
                  hasIconOnly
                  iconDescription="Close"
                  renderIcon={Close}
                  className="hiw-panel__close-btn"
                  onClick={() => setIsOpen(false)}
                />
              </header>

              {howItWorks.tags?.length > 0 && (
                <div className="hiw-panel__tags">
                  {howItWorks.tags.map((tag, i) => (
                    <Tag
                      key={tag}
                      type={TAG_TYPES[i % TAG_TYPES.length]}
                      size="sm">
                      {tag}
                    </Tag>
                  ))}
                </div>
              )}

              {howItWorks.description && (
                <p className="hiw-panel__description">
                  {howItWorks.description}
                </p>
              )}

              {howItWorks.steps?.length > 0 && (
                <ol className="hiw-panel__steps">
                  {howItWorks.steps.map((step, i) => (
                    <li key={i} className="hiw-panel__step">
                      <span className="hiw-panel__step-num">{i + 1}</span>
                      <span className="hiw-panel__step-text">{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <aside className="pattern-sidebar">
        <p className="pattern-sidebar__heading">Add elements</p>

        <div className="pattern-sidebar__items">
          {items.map(({ nodeType, icon, label, description }) => (
            <div
              key={nodeType}
              className="pattern-sidebar__card"
              draggable
              onDragStart={event => onDragStart(event, nodeType)}>
              <div className="pattern-sidebar__card-icon">{icon}</div>
              <div className="pattern-sidebar__card-text">
                <span className="pattern-sidebar__card-label">{label}</span>
                <span className="pattern-sidebar__card-description">
                  {description}
                </span>
              </div>
            </div>
          ))}
        </div>

        <hr className="pattern-sidebar__divider" />

        <p className="pattern-sidebar__instruction">{instruction}</p>

        {howItWorks && (
          <>
            <hr className="pattern-sidebar__divider" />
            <Button
              ref={btnRef}
              kind="tertiary"
              size="md"
              renderIcon={Information}
              aria-expanded={isOpen}
              onClick={handleToggle}
              className="pattern-sidebar__how-btn">
              How it works
            </Button>
          </>
        )}
      </aside>

      {panel}
    </>
  );
};

export default PatternSidebar;
