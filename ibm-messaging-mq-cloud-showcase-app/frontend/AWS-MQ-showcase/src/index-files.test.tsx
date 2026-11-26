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

// Tests the index files that only re-export a component (DevHandbook,
// TutorialHeader and LandingPage). It checks that each index file gives the
// same component as the file it points to.

import DevHandbook from './components/DevHandbook';
import DevHandbookComponent from './components/DevHandbook/DevHandbook';
import TutorialHeader from './components/TutorialHeader';
import TutorialHeaderComponent from './components/TutorialHeader/TutorialHeader';
import LandingPage from './content/LandingPage';
import LandingPageComponent from './content/LandingPage/LandingPage';

describe('index files', () => {
  it('DevHandbook/index exports the DevHandbook component', () => {
    expect(DevHandbook).toBe(DevHandbookComponent);
  });

  it('TutorialHeader/index exports the TutorialHeader component', () => {
    expect(TutorialHeader).toBe(TutorialHeaderComponent);
  });

  it('LandingPage/index exports the LandingPage component', () => {
    expect(LandingPage).toBe(LandingPageComponent);
  });
});
