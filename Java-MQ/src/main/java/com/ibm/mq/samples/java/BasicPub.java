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

import com.ibm.mq.MQTopic;
import com.ibm.mq.constants.CMQC;
import com.ibm.mq.constants.MQConstants;

/*
    I think this needs to use a topic not a queue and thus needs looking at again
*/

public class BasicPub {

    public static void main(String[] args) {

        MQTopic topic;

        BasicProducer producer = new BasicProducer();
        BasicMQFunctions mqFunctions = new BasicMQFunctions();

        try {
            int openOptions = MQConstants.MQOO_OUTPUT | MQConstants.MQOO_FAIL_IF_QUIESCING;
            int openAs = CMQC.MQTOPIC_OPEN_AS_PUBLICATION;
            topic = mqFunctions.connectTopic(openOptions, openAs);
            MQDetails details = mqFunctions.getFirstDetails();

            String payload = "{\"Greeting\": \"Hello from Java publisher at " + Instant.now() + "\"}";

            producer.putMessage(details, mqFunctions.getProps(), topic, BasicProducer.PRODUCER_PUT, payload, null);

        } catch (com.ibm.mq.MQException e) {
            System.out.println("Could not connect to queue manager — reason code: " + e.getReason());
        } catch (Exception e) {
            System.out.println("Unexpected error for endpoint: " + e.getMessage());
        } finally {
            mqFunctions.close();
        }
        System.out.println("Sample MQ PUB application ending");
    }
}