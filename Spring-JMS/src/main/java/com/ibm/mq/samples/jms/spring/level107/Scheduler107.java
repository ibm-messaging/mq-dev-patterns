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

package com.ibm.mq.samples.jms.spring.level107;

import com.ibm.mq.samples.jms.spring.globals.Constants;
import com.ibm.mq.samples.jms.spring.globals.data.OurData;
import com.ibm.mq.samples.jms.spring.globals.data.OurOtherData;
import com.ibm.mq.samples.jms.spring.level106.SendMessageService106;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

//@Component
@EnableScheduling
public class Scheduler107 {
    protected final Log logger = LogFactory.getLog(getClass());

    private final SendMessageService107 service;
    static private int i = 0;

    Scheduler107(SendMessageService107 service) {
        this.service = service;
    }

    @Scheduled(initialDelay = 35 * Constants.SECOND, fixedRate = 2 * Constants.MINUTE)
    public void run() {
        String greeting = "Sending data in cycle :" + i++;
        OurData msg1 = new OurData(greeting);
        OurData msg2 = new OurData(greeting);

        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info("Sending messages");

        logger.info(msg1);
        service.sendAsyncReply(msg2);
        service.sendSyncReply(msg1);

    }
}
