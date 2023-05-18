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

package com.ibm.mq.samples.jms.spring.level107;

import com.ibm.jakarta.jms.JMSTextMessage;
import com.ibm.mq.samples.jms.spring.globals.Constants;
import com.ibm.mq.samples.jms.spring.globals.data.OurData;
import com.ibm.mq.samples.jms.spring.globals.data.ReplyData;
import com.ibm.mq.samples.jms.spring.globals.handlers.OurMessageConverter;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.jms.core.MessageCreator;
import org.springframework.stereotype.Service;

import jakarta.jms.DeliveryMode;
import jakarta.jms.JMSException;
import jakarta.jms.Message;
import jakarta.jms.Session;
import java.util.UUID;


@Service
public class SendMessageService107 {
    protected final Log logger = LogFactory.getLog(getClass());

    @Value("${app.l107.queue.name1}")
    public String sendQueue;

    @Value("${app.l107.queue.name2}")
    public String replyQueue;

    final private JmsTemplate myNonJmsTemplate107;

    final private OurMessageConverter ourConverter = new OurMessageConverter();

    SendMessageService107(JmsTemplate myNonJmsTemplate107) {
        this.myNonJmsTemplate107 = myNonJmsTemplate107;
    }

    public void sendAsyncReply(OurData msg) {
        logger.info("Sending Message with Async Reply");
        myNonJmsTemplate107.send(sendQueue, new MessageCreator() {
            @Override
            public Message createMessage(Session session) throws JMSException {
                Message jmsmsg = ourConverter.toMessage(msg, session);
                jmsmsg.setJMSCorrelationID(UUID.randomUUID().toString());
                jmsmsg.setJMSExpiration(5 * Constants.MINUTE);
                jmsmsg.setJMSDeliveryMode(DeliveryMode.NON_PERSISTENT);
                jmsmsg.setJMSReplyTo(session.createQueue(replyQueue));
                return jmsmsg;
            }
        });
    }

    public void sendSyncReply(OurData msg) {
        logger.info("Sending Message with Sync Reply");
        Object reply = myNonJmsTemplate107.sendAndReceive(sendQueue, new MessageCreator() {
            @Override
            public Message createMessage(Session session) throws JMSException {
                Message jmsmsg = ourConverter.toMessage(msg, session);
                jmsmsg.setJMSCorrelationID(UUID.randomUUID().toString());
                jmsmsg.setJMSExpiration(5 * Constants.MINUTE);
                jmsmsg.setJMSDeliveryMode(DeliveryMode.NON_PERSISTENT);
                return jmsmsg;
            }
        });
        try {
            logger.info("Reply received");

            if (null == reply) {
                logger.info("Reply is null");
            } else if (reply instanceof JMSTextMessage) {
                logger.info("Reply is a text message, attempting to extract data");
                JMSTextMessage txtReply = (JMSTextMessage) reply;
                logger.info(txtReply.getText());
                ReplyData rr = ourConverter.replyFromMessage(txtReply);
                if (null != rr) {
                    logger.info("Have converted reply");
                    rr.logResult();
                } else {
                    logger.warn("Reply wasn't what was expected");
                }

            } else {
                logger.info("reply is not null, but of unexpected type");
                logger.info("reply is of type : " + reply.getClass());
            }
        } catch (JMSException e) {
            logger.warn("JMSException processing reply");
            logger.warn(e.getMessage());
        }
    }

}



