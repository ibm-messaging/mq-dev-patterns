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

import com.ibm.mq.samples.jms.spring.globals.data.ReplyData;
import com.ibm.mq.samples.jms.spring.globals.handlers.OurMessageConverter;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.jms.*;


@Service
public class SendMessageService109 {
    protected final Log logger = LogFactory.getLog(getClass());

    @Autowired
    private ConnectionFactory connectionFactory;

    final private OurMessageConverter ourConverter = new OurMessageConverter();

    public void reply(Destination replyDest, ReplyData msg, String correlation) {
        try {
            JMSContext context = connectionFactory.createContext();

            TextMessage message = context.createTextMessage("TBD");
            //message.setJMSMessageID(correlation);
            message.setJMSCorrelationID(correlation);
            message.setText(ourConverter.toJsonString(msg));

            JMSProducer producer = context.createProducer();
            // Make sure message put on a reply queue is non-persistent so non XMS/JMS apps
            // can get the message off the temp reply queue
            producer.setDeliveryMode(DeliveryMode.NON_PERSISTENT);
            producer.send(replyDest, message);
        } catch (JMSException e) {
            logger.warn("JMS Exception attempting to create and send reply");
            logger.warn(e.getMessage());
        }

    }


}



