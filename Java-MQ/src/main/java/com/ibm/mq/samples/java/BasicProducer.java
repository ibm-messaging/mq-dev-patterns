/*
 * (c) Copyright IBM Corporation 2026
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

import java.util.logging.Level;

import com.ibm.mq.MQDestination;
import com.ibm.mq.MQMessage;
import com.ibm.mq.MQPutMessageOptions;
import com.ibm.mq.constants.MQConstants;

/*
 * A common class used to put messages to a queue and to publish to a topic
 */
public class BasicProducer {

  private static final BasicLogger logger = new BasicLogger(BasicProducer.class);

  public Boolean putMessage(MQDestination destination, String message, String replyToQueueName) {

    MQMessage mqMessage = new MQMessage();
    MQPutMessageOptions pmo = new MQPutMessageOptions();

    try {
      // Convert the payload to the mqMessage object. We know it will be a text string in these example.
      mqMessage.writeString(message);

      // Set common message properties
      mqMessage.format = MQConstants.MQFMT_STRING;
      mqMessage.persistence = MQConstants.MQPER_NOT_PERSISTENT;

      // Set the PUT options. We are not going to use transactions for these messages
      pmo.options = MQConstants.MQPMO_NO_SYNCPOINT |
          MQConstants.MQPMO_NEW_MSG_ID |
          MQConstants.MQPMO_NEW_CORREL_ID;
      // Send message
      destination.put(mqMessage, pmo);

      logger.log(Level.INFO,"Message sent: {0}", message);
      return true;
    } catch (Exception e) {
      logger.logException(e);
      return false;
    }
  }
}