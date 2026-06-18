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
import com.ibm.mq.MQMessage;
import com.ibm.mq.MQPutMessageOptions;
import com.ibm.mq.MQQueue;
import com.ibm.mq.MQTopic;
import com.ibm.mq.constants.MQConstants;

public class BasicProducer {

    public static final String PRODUCER_PUT = "queue";
    public static final String PRODUCER_PUBLISH = "topic";
    public static final String PRODUCER_RESPONSE = "model_queue";

    public Boolean putMessage(MQDetails details, Hashtable<String, Object> props, MQDestination destination, String mode, String message, String replyToQueueName) {

        MQMessage mqMessage = new MQMessage();
        MQPutMessageOptions pmo = new MQPutMessageOptions();

        try {
            // Write the payload
            mqMessage.writeString(message);

            // Set common message properties
            mqMessage.format = MQConstants.MQFMT_STRING;

            switch (mode) {
                case PRODUCER_PUT:
                    mqMessage.persistence = MQConstants.MQPER_PERSISTENT;
                    break;
                case PRODUCER_PUBLISH:
                    mqMessage.persistence = MQConstants.MQPER_PERSISTENT;
                    pmo.options = MQConstants.MQPMO_NO_SYNCPOINT |
                            MQConstants.MQPMO_NEW_MSG_ID |
                            MQConstants.MQPMO_NEW_CORREL_ID;
                    break;
                case PRODUCER_RESPONSE:
                    mqMessage.persistence = MQConstants.MQPER_NOT_PERSISTENT;
                    if (replyToQueueName != null && !replyToQueueName.isEmpty()) {
                        mqMessage.replyToQueueName = replyToQueueName;
                    }
                    break;

                default:
                    System.err.println("Invalid producer mode.");
                    return false;
            }

            // Send message
            if (destination instanceof MQQueue) {
                ((MQQueue) destination).put(mqMessage, pmo);
            } else if (destination instanceof MQTopic) {
                ((MQTopic) destination).put(mqMessage, pmo);
            } else {
                System.err.println("Unsupported MQDestination type.");
                return false;
            }

            System.out.println("Message sent: " + message);
            return true;

        } catch (MQException mqe) {
            System.err.println("MQException during put: " + mqe.getMessage());
            return false;

        } catch (IOException ioe) {
            System.err.println("IOException during put: " + ioe.getMessage());
            return false;
        }
    }

    void putMessage(MQQueue queue, String PRODUCER_PUT, String sampleMessage, Object object) {
        throw new UnsupportedOperationException("Not supported yet.");
    }
}