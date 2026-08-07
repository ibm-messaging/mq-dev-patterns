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

public class BasicGet {

    public static final int DEFAULTGETVALUE = 1;

    public static void main(String[] args) {

        BasicMQFunctions mqFunctions = new BasicMQFunctions();
        BasicConsumer basicConsumer = new BasicConsumer();

        // How many messages to get from queue, if not specified use default value
        int count = (args.length > 1) ? Integer.parseInt(args[1]) : DEFAULTGETVALUE;

        // Connect, get messages, disconnect
        try {
            int openOptions = MQConstants.MQOO_INPUT_AS_Q_DEF;
            MQQueue queue = mqFunctions.connectQueue(openOptions);
            MQDetails details = mqFunctions.getFirstDetails();

            while (count > 0) {
                basicConsumer.getMessage(details, mqFunctions.getProps(), queue, BasicConsumer.CONSUMER_GET);
                count--;
            }

        } catch (com.ibm.mq.MQException e) {
            System.out.println("Could not connect to queue manager — reason code: " + e.getReason());
        } catch (Exception e) {
            System.out.println("Unexpected error for endpoint: " + e.getMessage());
        } finally {
            mqFunctions.close();
        }
    }
}