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

import java.io.IOException;
import java.util.logging.Level;

import com.ibm.mq.MQDestination;
import com.ibm.mq.MQException;
import com.ibm.mq.MQGetMessageOptions;
import com.ibm.mq.MQMessage;
import com.ibm.mq.constants.MQConstants;

/*
 * A common class used to receive messages from a queue. Which might be
 * associated with a subscription.
 */
public class BasicConsumer {

  private static final BasicLogger logger = new BasicLogger(BasicConsumer.class);

  public Boolean getMessage(MQDestination destination) {
    return getMessage(destination, null);
  }

  /*
   * Wait for up to the waitInterval for a message to arrive on the queue.
   * Return true if there is a valid message; false otherwise
   */
  public Boolean getMessage(MQDestination destination, byte[] correlId) {

    MQMessage msg = new MQMessage();
    MQGetMessageOptions gmo = new MQGetMessageOptions();

    gmo.options = MQConstants.MQGMO_WAIT |
        MQConstants.MQGMO_CONVERT |
        MQConstants.MQGMO_NO_SYNCPOINT |
        MQConstants.MQGMO_FAIL_IF_QUIESCING;
    gmo.waitInterval = 5000; // 5 seconds

    // If a correlation ID has been given, use that to match responses
    if (correlId != null) {
      gmo.matchOptions = MQConstants.MQMO_MATCH_CORREL_ID;
      msg.correlationId = correlId;
      logger.log(Level.INFO, "Waiting for messages with correlId {0}.",BasicMQFunctions.getHexString(correlId));
    }

    try {
      // Get the message
      destination.get(msg, gmo);

      // Can assume that it's a String message in these samples
      String str = msg.readStringOfByteLength(msg.getDataLength());
      logger.log(Level.INFO, "Received message: {0}", str);
    } catch (MQException mqe) {
      if (mqe.reasonCode == MQConstants.MQRC_NO_MSG_AVAILABLE) {
        logger.log(Level.INFO, "No more messages.");
        return false;
      } else {
        logger.logException("Error retrieving message", mqe);
        return false;
      }
    } catch (IOException e) {
      logger.logException(e);
      return false;
    }

    return true;
  }
}