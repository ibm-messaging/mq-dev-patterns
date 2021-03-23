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

package com.ibm.mq.samples.jms.spring.level106;

import com.ibm.mq.samples.jms.spring.globals.data.OurData;
import com.ibm.mq.samples.jms.spring.globals.handlers.OurMessageConverter;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;


//@Component
public class MessageConsumer106 {
    protected final Log logger = LogFactory.getLog(getClass());

    final private OurMessageConverter converter = new OurMessageConverter();

    @JmsListener(destination = "${app.l106.queue.name2}")
    public void receiveOther(String message) {
        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info("Received message of type: " + message.getClass().getSimpleName());
        logger.info("Received message :" + message);
        logger.info("Attempting Json parsing");
        OurData data = converter.fromString(message);
        if (null != data) {
            logger.info("Message was JSON Compliant");
            logger.info(data);
        } else {
            logger.warn("Message string was not JSON");
        }
    }

}
