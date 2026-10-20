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

/*
 * This application uses the MQ Base Java classes to wait for messages to a queue and
 * then send responses to the nominated reply queue.
 */
public class BasicResponse {

  private static final BasicLogger logger = new BasicLogger(BasicResponse.class);

  public static void main(String[] args) {

    BasicMQFunctions mqFunctions = new BasicMQFunctions();

    try {
      MQQueueManager qMgr = mqFunctions.connect();

      // Open the input queue
      int openOptions = MQConstants.MQOO_INPUT_AS_Q_DEF | MQConstants.MQOO_OUTPUT | MQConstants.MQOO_INQUIRE;
      MQQueue queue = mqFunctions.accessQueue(openOptions);

      boolean keepRunning = true;

      while (keepRunning) {

        // Try to get a message. This will be done in syncpoint, so the reply can be sent as part of the
        // same transaction.
        MQMessage requestMsg = new MQMessage();
        MQGetMessageOptions gmo = new MQGetMessageOptions();
        gmo.options = MQConstants.MQGMO_WAIT | MQConstants.MQGMO_CONVERT | MQConstants.MQGMO_SYNCPOINT;
        gmo.waitInterval = 10000;  // wait 10 seconds

        try {
          // Receive a message. This will throw an exception if there is no message available
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

          // The behaviour for msgid/correlid manipulation is in the low-byte of
          // the reportOptions. The default (0) is both NONE and COPY_MSG_ID_TO_CORRELID
          int reportOptions = requestMsg.report;
          if ((reportOptions & 255) == MQConstants.MQRO_COPY_MSG_ID_TO_CORREL_ID) {
            logger.log(Level.INFO,"Copying msgId to correlId");
            responseMsg.correlationId = requestMsg.messageId;
          } else {
            if ((reportOptions & MQConstants.MQRO_PASS_CORREL_ID) != 0) {
              responseMsg.correlationId = requestMsg.correlationId;
            }
            if ((reportOptions & MQConstants.MQRO_PASS_MSG_ID) != 0) {
              responseMsg.messageId = requestMsg.messageId;
            }
          }

          MQPutMessageOptions pmo = new MQPutMessageOptions();
          pmo.options = MQConstants.MQPMO_SYNCPOINT;

          // Put the message to the dynamic reply queue as part of the same transaction
          // Don''t need to explicitly open the queue; for this kind of pattern it is appropriate
          // to use the qMgr.put() method. This is analagous to the MQPUT1 verb.
          qMgr.put(replyToQueue, responseMsg, pmo);

          // Commit the transaction, permanently removing the request message from the input queue
          qMgr.commit();
          logger.log(Level.INFO,"Sent reply to: {0}", replyToQueue);
          logger.log(Level.INFO,"Reply payload: {0}", replyPayload);

        } catch (MQException mqe) {
          // NO_MSG_AVAILABLE is an expected situation
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
