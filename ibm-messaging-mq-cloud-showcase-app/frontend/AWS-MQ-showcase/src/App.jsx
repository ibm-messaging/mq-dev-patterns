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
import TutorialHeader from './components/TutorialHeader';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './content/LandingPage';
import RepoPage from './content/RepoPage';
import { Content, Theme } from '@carbon/react';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <>
      <Theme theme="g100">
        <TutorialHeader />
      </Theme>
      <Content>
        <ToastContainer
          style={{ height: '50px' }}
          position="bottom-right"
          autoClose={2000}
          hideProgressBar={false}
          closeOnClick
          pauseOnFocusLoss={false}
          pauseOnHover={false}
          theme="dark"
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/repos" element={<RepoPage />} />
        </Routes>
      </Content>
    </>
  );
}

export default App;
