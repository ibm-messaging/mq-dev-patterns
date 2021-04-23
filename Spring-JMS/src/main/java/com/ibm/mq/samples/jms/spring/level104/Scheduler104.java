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

package com.ibm.mq.samples.jms.spring.level104;

import com.ibm.mq.samples.jms.spring.globals.Constants;
import com.ibm.mq.samples.jms.spring.globals.data.OurData;
import com.ibm.mq.samples.jms.spring.globals.data.OurOtherData;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

//@Component
@EnableScheduling
public class Scheduler104 {
    protected final Log logger = LogFactory.getLog(getClass());

    private final SendMessageService104 service;
    static private int i = 0;

    Scheduler104(SendMessageService104 service) {
        this.service = service;
    }

    @Scheduled(initialDelay = 50 * Constants.SECOND, fixedRate = 2 * Constants.MINUTE)
    public void run() {
        String greeting = "Sending data in cycle :" + i++;
        OurData msg1 = new OurData(greeting);
        OurOtherData msg2 = new OurOtherData(greeting);

        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info("Sending messages");

        logger.info(msg1);
        service.send(msg1);

        logger.info(msg2);
        service.send(msg2);
    }
}
