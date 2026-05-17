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

import java.util.Hashtable;

public class BasicProducerWrapper {

    MQQueueManager qMgr = null;
    MQQueue queue = null;

    public void sendMessage() {

        SampleEnvSetter envSetter = new SampleEnvSetter();
        envSetter.setEnvValues();

        int length = envSetter.getDetails().size();
        System.out.println("Total MQ endpoints: " + length);

        for (int i = 0; i < length; i++) {
            MQDetails details = envSetter.getDetails().get(i);
            Hashtable<String, Object> props = envSetter.getProps().get(i);
            System.out.println("ProducerWrapper Properties: " + props);

            try {
                // Connect to Queue Manager
                qMgr = new MQQueueManager(details.getQMGR(), props);
                System.out.println("Connected to queue manager: " + details.getQMGR());

                // Open queue for output
                int openOptions = MQConstants.MQOO_OUTPUT | MQConstants.MQOO_FAIL_IF_QUIESCING;
                queue = qMgr.accessQueue(details.getQUEUE_NAME(), openOptions);
                System.out.println("Opened queue: " + details.getQUEUE_NAME());

                // Send message
                BasicProducer producer = new BasicProducer();
                String sampleMessage = "Hello from BasicProducerWrapper!";
                boolean status = producer.putMessage(details, props, queue, BasicProducer.PRODUCER_PUT, sampleMessage, null);

                if (status) {
                    System.out.println("Message successfully sent.");
                } else {
                    System.err.println("Message sending failed.");
                }

            } catch (Exception e) {
                System.err.println("Error during message send:");
                e.printStackTrace();
            } finally {
                try {
                    if (queue != null)
                        queue.close();
                    if (qMgr != null)
                        qMgr.disconnect();
                } catch (MQException me) {
                    System.err.println("Error closing MQ resources:");
                    me.printStackTrace();
                }
            }
        }
    }
}
