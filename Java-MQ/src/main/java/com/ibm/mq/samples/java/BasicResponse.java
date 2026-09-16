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

import com.ibm.mq.MQException;
import com.ibm.mq.MQGetMessageOptions;
import com.ibm.mq.MQMessage;
import com.ibm.mq.MQPutMessageOptions;
import com.ibm.mq.MQQueue;
import com.ibm.mq.MQQueueManager;
import com.ibm.mq.constants.MQConstants;

public class BasicResponse {

    public static void main(String[] args) {
        
        BasicMQFunctions mqFunctions = new BasicMQFunctions();

        try {

            int openOptions = MQConstants.MQOO_INPUT_AS_Q_DEF | MQConstants.MQOO_OUTPUT | MQConstants.MQOO_INQUIRE;
            MQQueue queue = mqFunctions.connectQueue(openOptions);

            boolean keepRunning = true;
            
            while (keepRunning) {
                MQMessage requestMsg = new MQMessage();
                MQGetMessageOptions gmo = new MQGetMessageOptions();
                gmo.options = MQConstants.MQGMO_WAIT | MQConstants.MQGMO_CONVERT;
                gmo.waitInterval = 10000;  // wait 10 seconds

                try {
                    queue.get(requestMsg, gmo);
                    String body = requestMsg.readStringOfByteLength(requestMsg.getDataLength());
                    System.out.println("Received request: " + body);

                    // Get reply-to queue name
                    String replyToQueue = requestMsg.replyToQueueName;
                    if (replyToQueue == null || replyToQueue.isEmpty()) {
                        System.out.println("No reply-to queue specified. Skipping response.");
                        continue;
                    }

                    // Create a response message
                    MQMessage responseMsg = new MQMessage();
                    responseMsg.format = MQConstants.MQFMT_STRING;
                    responseMsg.messageType = MQConstants.MQMT_REPLY;
                    String replyPayload = "{\"Response\": \"Reply to message: " + body + "\"}";
                    responseMsg.writeString(replyPayload);

                    MQPutMessageOptions pmo = new MQPutMessageOptions();
                    pmo.options = MQConstants.MQPMO_NO_SYNCPOINT;

                    // Put the message to the dynamic reply queue
                    MQQueueManager qMgr = mqFunctions.connect();
                    MQQueue replyQueue = qMgr.accessQueue(replyToQueue, MQConstants.MQOO_OUTPUT);
                    replyQueue.put(responseMsg, pmo);
                    replyQueue.close();

                    System.out.println("Sent reply to: " + replyToQueue);
                    System.out.println("Reply payload: " + replyPayload);

                } catch (MQException mqe) {
                    if (mqe.reasonCode == MQConstants.MQRC_NO_MSG_AVAILABLE) {
                        System.out.println("No more messages. Exiting...");
                        keepRunning = false;
                    } else {
                        System.err.println("MQ error getting/putting message: " + mqe.getMessage());
                    }
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            mqFunctions.close();
        }
        System.exit(0);
    }
}