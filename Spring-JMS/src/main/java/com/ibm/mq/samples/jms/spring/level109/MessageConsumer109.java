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

package com.ibm.mq.samples.jms.spring.level109;

import com.ibm.mq.samples.jms.spring.globals.data.OurData;
import com.ibm.mq.samples.jms.spring.globals.data.ReplyData;
import com.ibm.mq.samples.jms.spring.globals.handlers.OurMessageConverter;
import com.ibm.mq.samples.jms.spring.globals.utils.MessageUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import jakarta.jms.Destination;
import jakarta.jms.JMSException;
import jakarta.jms.Message;


//@Component
public class MessageConsumer109 {
    protected final Log logger = LogFactory.getLog(getClass());

    final private SendMessageService109 service;

    final private OurMessageConverter converter = new OurMessageConverter();

    MessageConsumer109(SendMessageService109 service) {
        this.service = service;
    }

    @JmsListener(destination = "${app.l109.queue.name2}")
    public void receiveRequest(Message message,
                               @Header("JMSXDeliveryCount") Integer deliveryCount) {
        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info("Received message of type: " + message.getClass().getSimpleName());
        logger.info("Received message :" + message);
        MessageUtils.checkMessageType(message);

        try {
            Destination replyDest = message.getJMSReplyTo();
            //String correlation = message.getJMSCorrelationID();
            String correlation = message.getJMSMessageID();
            logger.info("Attempting Json parsing");
            Object obj = converter.fromMessage(message);
            // If the deliveryCount >=3 then perhaps the temp reply queue is broken,
            // ideally should dead letter queue the request.
            if (3 <= deliveryCount) {
                logger.warn("Message delivered " + deliveryCount + " times.");
                logger.warn("Message should be dead letter queued, as it might be poisoned");
            } else if (null == obj) {
                logger.warn("Message string was not JSON");
            } else if (obj instanceof OurData) {
                OurData data = (OurData) obj;
                logger.info("Message was JSON Compliant");
                logger.info(data);
                createResponse(replyDest, data, correlation);
            } else {
                logger.warn("Unexpected result from data conversion");
            }
        } catch (JMSException e) {
            logger.warn("JMSException processing request");
        }
    }

    private void createResponse(Destination replyDest, OurData data, String correlation) {
        if (null == replyDest) {
            logger.warn("No Reply destination");
        } else {
            logger.info("Sending reply with correlation id : " + correlation);
            ReplyData reply = new ReplyData();
            reply.calcResponse(data.getValue());
            service.reply(replyDest, reply, correlation);
        }
    }

}
