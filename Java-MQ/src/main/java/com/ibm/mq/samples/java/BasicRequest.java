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

import java.time.Instant;
import java.util.logging.Level;

import com.ibm.mq.MQMessage;
import com.ibm.mq.MQPutMessageOptions;
import com.ibm.mq.MQQueue;
import com.ibm.mq.MQQueueManager;
import com.ibm.mq.constants.MQConstants;

public class BasicRequest {
  private static final BasicLogger logger = new BasicLogger(BasicRequest.class);

  public static void main(String[] args) {

    BasicMQFunctions mqFunctions = new BasicMQFunctions();

    try {
      MQQueueManager qMgr = mqFunctions.connect();

      int openOptions = MQConstants.MQOO_OUTPUT;
      MQQueue requestQueue = mqFunctions.accessQueue(openOptions);

      MQDetails details = mqFunctions.getFirstDetails();

      MQQueue replyQueue = qMgr.accessQueue(details.getMODEL_QUEUE_NAME(), MQConstants.MQOO_INPUT_EXCLUSIVE, null, details.getDYNAMIC_QUEUE_PREFIX(), null);

      String dynamicReplyQueueName = replyQueue.getName();
      logger.log(Level.INFO,"Opened dynamic reply-to queue: {0}", dynamicReplyQueueName);

      MQMessage request = new MQMessage();
      request.format = MQConstants.MQFMT_STRING;
      request.replyToQueueName = dynamicReplyQueueName;
      request.messageType = MQConstants.MQMT_REQUEST;

      String payload = "{\"Greeting\": \"Hello from Java Requester at " + Instant.now() + "\"}";
      request.writeString(payload);

      MQPutMessageOptions pmo = new MQPutMessageOptions();
      pmo.options = MQConstants.MQPMO_NO_SYNCPOINT;

      requestQueue.put(request, pmo);
      logger.log(Level.INFO,"Sent request message to queue: {0}", details.getQUEUE_NAME());
      logger.log(Level.INFO,"Waiting for reply on: {0}", dynamicReplyQueueName);

      boolean keepReading = true;
      BasicConsumer bc = new BasicConsumer();

      while (keepReading) {
        keepReading = bc.getMessage(replyQueue, BasicConsumer.CONSUMER_REQUEST);
      }

    } catch (Exception e) {
      logger.logException(e);
    } finally {
      mqFunctions.close();
    }
    System.exit(Globals.getExitCode());
  }
}