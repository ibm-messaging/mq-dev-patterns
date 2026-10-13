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

import com.ibm.mq.MQException;
import com.ibm.mq.MQGetMessageOptions;
import com.ibm.mq.MQMessage;
import com.ibm.mq.MQPutMessageOptions;
import com.ibm.mq.MQQueue;
import com.ibm.mq.MQQueueManager;
import com.ibm.mq.constants.MQConstants;

public class BasicResponse {

  private static final BasicLogger logger = new BasicLogger(BasicResponse.class);

  public static void main(String[] args) {

    BasicMQFunctions mqFunctions = new BasicMQFunctions();

    try {
      MQQueueManager qMgr = mqFunctions.connect();
      int openOptions = MQConstants.MQOO_INPUT_AS_Q_DEF | MQConstants.MQOO_OUTPUT | MQConstants.MQOO_INQUIRE;
      MQQueue queue = mqFunctions.accessQueue(openOptions);

      boolean keepRunning = true;

      while (keepRunning) {
        MQMessage requestMsg = new MQMessage();
        MQGetMessageOptions gmo = new MQGetMessageOptions();
        gmo.options = MQConstants.MQGMO_WAIT | MQConstants.MQGMO_CONVERT | MQConstants.MQGMO_SYNCPOINT;
        gmo.waitInterval = 10000;  // wait 10 seconds

        try {
          queue.get(requestMsg, gmo);
          String body = requestMsg.readStringOfByteLength(requestMsg.getDataLength());
          logger.log(Level.INFO,"Received request: {0}", body);

          // Get reply-to queue name
          String replyToQueue = requestMsg.replyToQueueName;
          if (replyToQueue == null || replyToQueue.isEmpty()) {
            logger.log(Level.INFO,"No reply-to queue specified. Skipping response.");
            continue;
          }

          // Create a response message
          MQMessage responseMsg = new MQMessage();
          responseMsg.format = MQConstants.MQFMT_STRING;
          responseMsg.messageType = MQConstants.MQMT_REPLY;
          String replyPayload = "{\"Response\": \"Reply to message: " + body + "\"}";
          responseMsg.writeString(replyPayload);

          MQPutMessageOptions pmo = new MQPutMessageOptions();
          pmo.options = MQConstants.MQPMO_SYNCPOINT;

          // Put the message to the dynamic reply queue
          MQQueue replyQueue = qMgr.accessQueue(replyToQueue, MQConstants.MQOO_OUTPUT);
          try {
            replyQueue.put(responseMsg, pmo);
          } finally {
            replyQueue.close();
          }

          qMgr.commit();
          logger.log(Level.INFO,"Sent reply to: {0}", replyToQueue);
          logger.log(Level.INFO,"Reply payload: {0}", replyPayload);

        } catch (MQException mqe) {
          if (mqe.reasonCode == MQConstants.MQRC_NO_MSG_AVAILABLE) {
            logger.log(Level.INFO,"No more messages.");
            keepRunning = false;
          } else {
            logger.logException(mqe);
          }
        }
      }
    } catch (Exception e) {
      logger.logException(e);
    } finally {
      mqFunctions.close();
    }

    System.exit(Globals.getExitCode());
  }
}
