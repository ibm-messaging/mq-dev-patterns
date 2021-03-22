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

package com.ibm.mq.samples.jms.spring.level103;

import com.ibm.mq.samples.jms.spring.globals.data.OurData;
import com.ibm.mq.samples.jms.spring.globals.data.OurOtherData;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.jms.annotation.JmsListener;

//@Component
public class MessageConsumer103 {
    protected final Log logger = LogFactory.getLog(getClass());

    @JmsListener(destination = "${app.l103.queue.name2}")
    public void receiveData(OurData message) {
        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info("Received message of type: " + message.getClass().getSimpleName());
        logger.info("Received message :" + message);
    }

    @JmsListener(destination = "${app.l103.queue.name2}")
    public void receiveOther(OurOtherData message) {
        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info("Received message of type: " + message.getClass().getSimpleName());
        logger.info("Received message :" + message);
    }

    @JmsListener(destination = "${app.l103.queue.name2}")
    public void receiveOther(String message) {
        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info("Received message of type: " + message.getClass().getSimpleName());
        logger.info("Received message :" + message);
    }
}
