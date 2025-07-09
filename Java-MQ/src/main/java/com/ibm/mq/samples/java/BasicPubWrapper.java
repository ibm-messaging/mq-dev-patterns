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

import com.ibm.mq.*;
import com.ibm.mq.constants.MQConstants;

import java.time.Instant;
import java.util.Hashtable;

public class BasicPubWrapper {

    MQQueueManager qMgr = null;
    MQQueue queue = null;

    public void sendMessage() {

        SampleEnvSetter envSetter = new SampleEnvSetter();
        envSetter.setEnvValues();

        int length = envSetter.getDetails().size();
        System.out.println("Total endpoints: " + length);

        for (int i = 0; i < length; i++) {
            MQDetails details = envSetter.getDetails().get(i);
            Hashtable<String, Object> props = envSetter.getProps().get(i);

            try {
                qMgr = new MQQueueManager(details.getQMGR(), props);
                System.out.println("Connected to queue manager: " + details.getQMGR());

                queue = qMgr.accessQueue(
                    details.getQUEUE_NAME(),
                    MQConstants.MQOO_OUTPUT | MQConstants.MQOO_FAIL_IF_QUIESCING
                );

                MQMessage msg = new MQMessage();
                msg.format = MQConstants.MQFMT_STRING;
                msg.persistence = MQConstants.MQPER_PERSISTENT;

                String payload = "{\"Greeting\": \"Hello from Java publisher at " + Instant.now() + "\"}";
                msg.writeString(payload);

                MQPutMessageOptions pmo = new MQPutMessageOptions();
                pmo.options = MQConstants.MQPMO_NO_SYNCPOINT |
                              MQConstants.MQPMO_NEW_MSG_ID |
                              MQConstants.MQPMO_NEW_CORREL_ID;

                queue.put(msg, pmo);

                System.out.println("Published message to queue: " + details.getQUEUE_NAME());
                System.out.println("Message content: " + payload);

            } catch (MQException mqe) {
                System.err.println("MQ error publishing message: " + mqe.getMessage());
                mqe.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                try {
                    if (queue != null) queue.close();
                    if (qMgr != null) qMgr.disconnect();
                } catch (MQException me) {
                    me.printStackTrace();
                }
            }
        }
    }
}
