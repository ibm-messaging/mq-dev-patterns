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

package com.ibm.mq.samples.jms.spring.level101;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;


@Service
public class SendMessageService101 {

    // This is a queue in put mode and a topic in pub mode
    @Value("${app.l101.dest.name1}")
    public String sendQueue;

    final private JmsTemplate jmsTemplate;

    SendMessageService101(JmsTemplate jmsTemplate) {
        this.jmsTemplate = jmsTemplate;
    }

    public void sendTextMsg(String msg) {
        jmsTemplate.send(sendQueue, s -> s.createTextMessage(msg));
    }

    public void send(String msg) {
        jmsTemplate.convertAndSend(sendQueue, msg);
    }

}



