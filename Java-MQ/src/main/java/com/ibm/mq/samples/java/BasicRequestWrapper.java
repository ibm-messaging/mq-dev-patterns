/*
* (c) Copyright IBM Corporation 2025
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
package com.ibm.mq.samples.java;

import java.time.Instant;
import java.util.Hashtable;

import com.ibm.mq.constants.MQConstants;

import com.ibm.mq.*;

public class BasicRequestWrapper {

    MQQueueManager qMgr = null;
    MQQueue queue = null;

    public void sendMessage() {

        SampleEnvSetter envSetter = new SampleEnvSetter();
        envSetter.setEnvValues();

        // iterate for every endpoint in env.json
        int length = envSetter.getDetails().size();
        System.out.println(length);

        for (int i = 0; i < length; i++) {
            MQDetails details = envSetter.getDetails().get(i);
            Hashtable<String, Object> props = envSetter.getProps().get(i);
            try {
                qMgr = new MQQueueManager(details.getQMGR(), props);
                System.out.println("Connected to queue manager: " + details.getQMGR());

                MQQueue replyQueue = qMgr.accessQueue(
                        details.getMODEL_QUEUE_NAME(),
                        MQConstants.MQOO_INPUT_EXCLUSIVE,
                        null,
                        details.getDYNAMIC_QUEUE_PREFIX(),
                        null);

                String dynamicReplyQueueName = replyQueue.getName();
                System.out.println("Opened dynamic reply-to queue: " + dynamicReplyQueueName);

                MQQueue requestQueue = qMgr.accessQueue(details.getQUEUE_NAME(), MQConstants.MQOO_OUTPUT);

                MQMessage request = new MQMessage();
                request.format = MQConstants.MQFMT_STRING;
                request.replyToQueueName = dynamicReplyQueueName;
                request.messageType = MQConstants.MQMT_REQUEST;

                String payload = "{\"Greeting\": \"Hello from Java Requester at " + Instant.now() + "\"}";
                request.writeString(payload);

                MQPutMessageOptions pmo = new MQPutMessageOptions();
                pmo.options = MQConstants.MQPMO_NO_SYNCPOINT;

                requestQueue.put(request, pmo);
                System.out.println("Sent request message to queue: " + details.getQUEUE_NAME());
                System.out.println("Waiting for reply on: " + dynamicReplyQueueName);

                boolean keepReading = true;
                BasicConsumer bc = new BasicConsumer();
                while (keepReading) {
                    keepReading = bc.getMessage(details, props, replyQueue, BasicConsumer.CONSUMER_REQUEST);
                }
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                try {
                    if (queue != null)
                        queue.close();
                    if (qMgr != null)
                        qMgr.disconnect();
                } catch (MQException me) {
                    me.printStackTrace();
                }
            }
        }
    }

}
