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

package com.ibm.mq.samples.jms.spring.level114;

import com.ibm.mq.samples.jms.spring.globals.data.OurData;
import com.ibm.mq.samples.jms.spring.globals.handlers.OurMessageConverter;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;


//@Service
public class SendMessageService114 {
    protected final Log logger = LogFactory.getLog(getClass());

    @Value("${app.l114.queue.name1}")
    public String sendQueue;

    final private JmsTemplate myNonJmsTemplate114;

    final private OurMessageConverter ourConverter = new OurMessageConverter();

    SendMessageService114(JmsTemplate myNonJmsTemplate114) {
        this.myNonJmsTemplate114 = myNonJmsTemplate114;
    }

    public void send(OurData msg) {
        logger.info("Sending Message");
        myNonJmsTemplate114.convertAndSend(sendQueue, msg);
//        myNonJmsTemplate114.send(sendQueue, new MessageCreator() {
//            @Override
//            public Message createMessage(Session session) throws JMSException {
//                Message jmsmsg = ourConverter.toMessage(msg, session);
//                return jmsmsg;
//            }
//        });
    }
}



