/*
 * (c) Copyright IBM Corporation 2021, 2023
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

package com.ibm.mq.samples.jms.spring.level110;

import com.ibm.mq.samples.jms.spring.globals.data.OurData;
import com.ibm.mq.samples.jms.spring.globals.handlers.OurMessageConverter;
import com.ibm.mq.samples.jms.spring.globals.utils.MessageUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Component;

import jakarta.jms.Destination;
import jakarta.jms.JMSException;
import jakarta.jms.Message;
import java.util.Date;


//@Component
@SendTo( "${app.l110.queue.name3}" )
public class MessageConsumer110 {
    protected final Log logger = LogFactory.getLog(getClass());

    final private OurMessageConverter converter = new OurMessageConverter();

    @JmsListener(destination = "${app.l110.queue.name2}", containerFactory = "myContainerFactory110")
    public String receiveRequest(Message message,
                                @Header("JMSXDeliveryCount") Integer deliveryCount) {
        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info("Received message of type: " + message.getClass().getSimpleName());
        logger.info("Received message :" + message);
        MessageUtils.checkMessageType(message);

        try {
            Destination replyDest = message.getJMSReplyTo();
            String correlation = message.getJMSCorrelationID();
            logger.info("Attempting Json parsing");
            Object obj = converter.fromMessage(message);
            // If the deliveryCount >=3 then perhaps we have a poison message
            // ideally should dead letter queue the message.
            if (3 <= deliveryCount) {
                logger.warn("Message delivered " + deliveryCount + " times.");
                logger.warn("Message should be dead letter queued, as it might be poisoned");
            } else if (null == obj) {
                logger.warn("Message string was not JSON");
            } else if (obj instanceof OurData) {
                OurData data = (OurData) obj;
                logger.info("Message was JSON Compliant");
                logger.info(data);
                if (null != replyDest) {
                    data.setRequestedReplyDest(replyDest.toString());
                }
                data.setCorrelation(correlation);
                data.setReceived(new Date());
                return converter.toJsonString(data);
            } else {
                logger.warn("Unexpected result from data conversion");
            }
        } catch (JMSException e) {
            logger.warn("JMSException processing request");
        }
        return null;
    }

}
