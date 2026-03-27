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

import com.ibm.mq.MQQueue;
import com.ibm.mq.constants.MQConstants;

public class BasicPut {
    
    public static final int DEFAULTPUTVALUE = 1;

    public static void main(String[] args) {

        BasicMQFunctions mqFunctions = new BasicMQFunctions();
        BasicProducer basicProducer = new BasicProducer();
        
        String sampleMessage = "You are putting messages!";

        // How many messages to put to queue, if not specified use default value
        int count = (args.length > 0) ? Integer.parseInt(args[1]) : DEFAULTPUTVALUE;

        // Connect using the connection string
        try {
            int openOptions = MQConstants.MQOO_OUTPUT | MQConstants.MQOO_FAIL_IF_QUIESCING;
            MQQueue queue = mqFunctions.connectQueue(openOptions);
            MQDetails details = mqFunctions.getFirstDetails();

            // Put messages on the queue
            while (count > 0) {
                basicProducer.putMessage(details, mqFunctions.getProps(), queue, BasicProducer.PRODUCER_PUT, sampleMessage, null);
                count--;
            }
        } catch (com.ibm.mq.MQException e) {
            System.out.println("Could not connect to queue manager — reason code: " + e.getReason());
            System.out.println(e.getMessage());
        } catch (Exception e) {
            System.out.println("Unexpected error: " + e.getMessage());
        } finally {
            mqFunctions.close();
        }
    }
}