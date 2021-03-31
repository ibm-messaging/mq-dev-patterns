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

package com.ibm.mq.samples.jms.spring.level115;

import com.ibm.mq.*;
import com.ibm.mq.constants.CMQC;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

//@Component
public class CmdRunner115 {
    protected final Log logger = LogFactory.getLog(getClass());

    @Value("${app.l115.queue.name1:DEV.QUEUE.1}")
    private String queueName = "";

    private final MQQueueManager mqQueueManager;

    CmdRunner115(MQQueueManager mqQueueManager) {
        this.mqQueueManager = mqQueueManager;
    }

    @Bean
    CommandLineRunner init() {
        return (args) -> {
            logger.info("Determining Backout threshold");
            try {
                int[] selectors = {
                        CMQC.MQIA_BACKOUT_THRESHOLD,
                        CMQC.MQCA_BACKOUT_REQ_Q_NAME };
                int[] intAttrs = new int[1];
                byte[] charAttrs = new byte[MQC.MQ_Q_NAME_LENGTH];

                int openOptions = MQC.MQOO_INPUT_AS_Q_DEF | MQC.MQOO_INQUIRE | MQC.MQOO_SAVE_ALL_CONTEXT;
                MQQueue myQueue = mqQueueManager.accessQueue(queueName, openOptions, null, null, null);
                logger.info("Queue Obtained");

                MQManagedObject moMyQueue = (MQManagedObject) myQueue;
                moMyQueue.inquire(selectors, intAttrs, charAttrs);

                int boThresh = intAttrs[0];
                String backoutQname = new String(charAttrs);

                logger.info("Backout Threshold: " + boThresh);
                logger.info("Backout Queue: " + backoutQname);

            } catch (MQException e) {
                logger.warn("MQException Error obtaining backout threshold");
                logger.warn(e.getMessage());
            }
        };
    }
}
