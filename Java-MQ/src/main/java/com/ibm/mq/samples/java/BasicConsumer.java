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


public class BasicConsumer {

  private static final BasicLogger logger = new BasicLogger(BasicConsumer.class);

  public static final String CONSUMER_GET = "queue";
  public static final String CONSUMER_SUB = "topic";
  public static final String CONSUMER_REQUEST = "model_queue";

  public Boolean getMessage(MQDestination destination, String mode) {

    MQMessage msg = new MQMessage();
    MQGetMessageOptions gmo = new MQGetMessageOptions();


    gmo.options = MQConstants.MQGMO_WAIT |
        MQConstants.MQGMO_CONVERT |
        MQConstants.MQGMO_NO_SYNCPOINT |
        MQConstants.MQGMO_FAIL_IF_QUIESCING;
    gmo.waitInterval = 5000;

    try {
      // Get message
      destination.get(msg, gmo);

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