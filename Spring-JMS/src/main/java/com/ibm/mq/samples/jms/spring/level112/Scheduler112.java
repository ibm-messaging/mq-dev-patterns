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

package com.ibm.mq.samples.jms.spring.level112;

import com.ibm.mq.samples.jms.spring.globals.Constants;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.jms.config.JmsListenerEndpointRegistry;
import org.springframework.jms.listener.MessageListenerContainer;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

//@Component
@EnableScheduling
public class Scheduler112 {
    protected final Log logger = LogFactory.getLog(getClass());

    // The listener registry allows us to control the @JmsListener endpoints
    private final JmsListenerEndpointRegistry registry;

    static private int i = 0;

    Scheduler112(JmsListenerEndpointRegistry registry) {
        this.registry = registry;
    }

    @Scheduled(initialDelay = 45 * Constants.SECOND, fixedRate = Constants.MINUTE)
    public void run() {
        String greeting = "Checking listener status cycle :" + i++;

        logger.info("Registered listeners IDs are : ");
        for (String listenerId : registry.getListenerContainerIds()) {
            logger.info("ID : " + listenerId);
        }

        logger.info("Checking our listener");
        MessageListenerContainer mlc = registry.getListenerContainer("listener112");
        if (! mlc.isRunning()) {
            logger.warn("Listener is not running, restarting it");
            mlc.start();
        } else {
            logger.warn("Listener is running, stopping it");
            mlc.stop();
        }

    }
}
