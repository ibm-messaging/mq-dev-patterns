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

import { Link } from 'react-router-dom';
import {
  Header,
  HeaderContainer,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  SkipToContent,
} from '@carbon/react';

const TutorialHeader = () => (
  <HeaderContainer
    render={() => (
      <Header aria-label="IBM MQ showcase">
        <SkipToContent />
        <HeaderName as={Link} to="/" prefix="IBM MQ">
          showcase
        </HeaderName>
        <HeaderNavigation aria-label="Getting started links">
          <HeaderMenuItem href="https://www.ibm.com/uk-en/products/mq">
            Getting started
          </HeaderMenuItem>
        </HeaderNavigation>
        <HeaderNavigation aria-label="Repository links">
          <HeaderMenuItem href="https://github.com/ibm-messaging/mq-dev-patterns.git">
            Repositories
          </HeaderMenuItem>
        </HeaderNavigation>
      </Header>
    )}
  />
);

export default TutorialHeader;
