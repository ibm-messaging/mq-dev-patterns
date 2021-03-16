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

import com.ibm.mq.samples.jms.spring.globals.OurData;
import com.ibm.mq.samples.jms.spring.globals.OurOtherData;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;


@Service
public class SendMessageService106 {

    @Value("${app.l106.queue.name1}")
    public String sendQueue;

    final private JmsTemplate myNonJmsTemplate;

    SendMessageService106(JmsTemplate myNonJmsTemplate) {
        this.myNonJmsTemplate = myNonJmsTemplate;
    }

    public void send(OurData msg) {
        myNonJmsTemplate.convertAndSend(sendQueue, msg);
    }
    public void send(OurOtherData msg) {
        myNonJmsTemplate.convertAndSend(sendQueue, msg);
    }
}



