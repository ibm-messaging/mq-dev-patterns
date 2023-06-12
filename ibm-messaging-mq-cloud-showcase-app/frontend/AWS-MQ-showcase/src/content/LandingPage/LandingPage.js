/**
 * Copyright 2022, 2023 IBM Corp.
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

import React, { useState } from 'react';
import PointPointIndex from '../../components/MQPatterns/PointToPoint/index';
import PubSubIndex from '../../components/MQPatterns/PubSub';
import RequestResponseIndex from '../../components/MQPatterns/RequestResponse';

import {  
  Tabs,  
  TabPanels,
  TabPanel,
  Grid,
  Column,
  ContentSwitcher,
  Switch,
} from '@carbon/react';

const LandingPage = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const isMobile = /Mobile/.test(navigator.userAgent);
  return (
    <Grid className="lanKLandding-page" fullWidth>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h1 className="landing-page__heading"> IBM MQ PATTERNS</h1>
      </Column>
      <Column lg={16} md={8} sm={4} className="landing-page__r2">
        <ContentSwitcher
          light
          selectedIndex={selectedTab}
          size={'sm'}
          onChange={e => {
            let { index } = e;
            setSelectedTab(index);
          }}>
          <Switch name="one" text="POINT-TO-POINT" />          
          {isMobile ? <></> : <Switch name="two" text="PUBLISHER/SUBSCRIBER" />}
          <Switch name="three" text="REQUEST/RESPONSE" />
        </ContentSwitcher>

        <Tabs selectedIndex={selectedTab}>
          <TabPanels>
            <TabPanel>
              <PointPointIndex />
            </TabPanel>
            {
              isMobile ?
              <></> :
              <TabPanel>
              <PubSubIndex />
              </TabPanel> 
            }            
            <TabPanel>
              <RequestResponseIndex />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Column>
      <Column lg={16} md={8} sm={4} className="landing-page__r3">
        <Grid>
          <Column md={4} lg={4} sm={4}>
            <h3 className="landing-page__label">
              Thousands of businesses worldwide depend on IBM MQ
            </h3>
          </Column>
          <Column md={4} lg={4} sm={4}>
            73% of the Fortune 100
          </Column>
          <Column md={4} lg={4} sm={4}>
            73% of the Fortune 100
          </Column>
          <Column md={4} lg={4} sm={4}>
            73% of the Fortune 100
          </Column>
        </Grid>
      </Column>
      <Column lg={16} md={8} sm={4} className="landing-page__r3">
        <Grid>
          <Column md={4} lg={4} sm={4}>
            <h3 className="landing-page__label">Benefits</h3>
          </Column>
          <Column md={4} lg={4} sm={4}>
            Insulate your business from risks
          </Column>
          <Column md={4} lg={4} sm={4}>
            Simple multi-style messaging
          </Column>
          <Column md={4} lg={4} sm={4}>
            24x7x365 technical support
          </Column>
        </Grid>
      </Column>
    </Grid>
  );
};

export default LandingPage;
