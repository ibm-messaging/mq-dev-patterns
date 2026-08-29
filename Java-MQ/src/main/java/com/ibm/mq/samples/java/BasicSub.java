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

import com.ibm.mq.MQTopic;
import com.ibm.mq.constants.CMQC;
import com.ibm.mq.constants.MQConstants;

public class BasicSub {

    public static void main(String[] args) {
        
        MQTopic topic;

        BasicMQFunctions mqFunctions = new BasicMQFunctions();   
        MQDetails details = mqFunctions.getFirstDetails();

        try {
            // Topic options
            int topicOpenOptions = MQConstants.MQSO_CREATE | MQConstants.MQSO_NON_DURABLE;
            int openAs = CMQC.MQTOPIC_OPEN_AS_SUBSCRIPTION;
            topic = mqFunctions.connectTopic(topicOpenOptions, openAs);

            boolean keepReading = true;
            BasicConsumer bc = new BasicConsumer();

            bc.getMessage(details, mqFunctions.getProps(), topic, BasicConsumer.CONSUMER_SUB);

        } catch (com.ibm.mq.MQException e) {
            System.out.println("Could not connect to queue manager — reason code: " + e.getReason());
        } catch (Exception e) {
            System.out.println("Unexpected error for endpoint: " + e.getMessage());
        } finally {
            mqFunctions.close();
        }
    }
}