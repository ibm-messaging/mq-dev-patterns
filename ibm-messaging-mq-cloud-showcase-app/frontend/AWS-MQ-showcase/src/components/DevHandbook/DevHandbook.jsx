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

import React, { useRef, useState } from 'react';
import { Button } from '@carbon/react';
import { Book } from '@carbon/icons-react';
import { SidePanel } from '@carbon/ibm-products';
import DevHandbookContent from './DevHandbookContent';

const DevHandbook = () => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);

  return (
    <>
      <Button
        ref={buttonRef}
        className="dev-handbook__trigger"
        kind="primary"
        renderIcon={Book}
        onClick={() => setOpen(true)}>
        Dev handbook
      </Button>
      <SidePanel
        open={open}
        onRequestClose={() => setOpen(false)}
        launcherButtonRef={buttonRef}
        title="Dev handbook"
        subtitle="Environment setup, configuration, and deployment modes for running the IBM MQ Messaging Playground locally."
        placement="right"
        size="lg"
        includeOverlay
        selectorPrimaryFocus=".dev-handbook__body"
        className="dev-handbook">
        <DevHandbookContent />
      </SidePanel>
    </>
  );
};

export default DevHandbook;
