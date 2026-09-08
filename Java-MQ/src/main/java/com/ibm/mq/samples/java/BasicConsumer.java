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

import java.io.IOException;
import java.util.Hashtable;

import com.ibm.mq.MQDestination;
import com.ibm.mq.MQException;
import com.ibm.mq.MQGetMessageOptions;
import com.ibm.mq.MQMessage;
import com.ibm.mq.MQQueue;
import com.ibm.mq.MQTopic;
import com.ibm.mq.constants.MQConstants;

public class BasicConsumer {

    public static final String CONSUMER_GET = "queue";
    public static final String CONSUMER_SUB = "topic";
    public static final String CONSUMER_REQUEST = "model_queue";

    public Boolean getMessage(MQDetails details, Hashtable<String, Object> props, MQDestination destination, String mode) {

        MQMessage msg = new MQMessage();
        MQGetMessageOptions gmo = new MQGetMessageOptions();

        switch (mode) {
            case CONSUMER_GET:
                gmo.options = MQConstants.MQGMO_NO_WAIT |
                        MQConstants.MQGMO_CONVERT |
                        MQConstants.MQGMO_FAIL_IF_QUIESCING;
                break;
            case CONSUMER_SUB:
                gmo.options = MQConstants.MQGMO_NO_SYNCPOINT |
                        MQConstants.MQGMO_WAIT |
                        MQConstants.MQGMO_CONVERT |
                        MQConstants.MQGMO_FAIL_IF_QUIESCING;
                gmo.waitInterval = MQConstants.MQWI_UNLIMITED;
                break;
            case CONSUMER_REQUEST:
                gmo.options = MQConstants.MQGMO_WAIT | MQConstants.MQGMO_CONVERT;
                gmo.waitInterval = 10000;
                break;
            default:
                break;
        }

        try {
            // Get message
            if (destination instanceof MQQueue) {
                ((MQQueue) destination).get(msg, gmo);
            } else if (destination instanceof MQTopic) {
                ((MQTopic) destination).get(msg, gmo);
            } else {
                System.err.println("Unsupported MQDestination type.");
                return false;
            }

            String str = msg.readStringOfByteLength(msg.getDataLength());
            System.out.println("Received message: " + str);
        } catch (MQException mqe) {
            if (mqe.reasonCode == MQConstants.MQRC_NO_MSG_AVAILABLE) {
                System.out.println("No more messages.");
                return false;
            } else {
                System.err.println("Error retrieving message: " + mqe);
                return false;
            }
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }

        return true;
    }
}