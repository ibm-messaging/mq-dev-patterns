/*
 * (c) Copyright IBM Corporation 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
 */

package com.ibm.mq.samples.jms.spring.shedules;

import com.ibm.mq.samples.jms.spring.globals.Constants;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// When enabled this component ensures that the application keeps running, until interrupted.
@Component
@EnableScheduling
public class HeartBeat {
    protected final Log logger = LogFactory.getLog(getClass());

    static private int i = 0;

    @Scheduled(initialDelay = 2 * Constants.MINUTE, fixedRate = Constants.HOUR)
    public void run() {
        String msg = "About to perform operation " + i++;
    }
}
