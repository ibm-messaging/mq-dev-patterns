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

/*
 * This application uses the MQ Base Java classes to put a request message to a queue,
 * creating a dynamic reply queue. It then waits for a response to be sent to that reply queue.
 */
public class BasicRequest {
  private static final BasicLogger logger = new BasicLogger(BasicRequest.class);

  public static void main(String[] args) {

    BasicMQFunctions mqFunctions = new BasicMQFunctions();

    try {
      MQQueueManager qMgr = mqFunctions.connect();

      // Open the output queue
      int openOptions = MQConstants.MQOO_OUTPUT;
      MQQueue requestQueue = mqFunctions.accessQueue(openOptions);

      MQDetails details = mqFunctions.getFirstDetails();

      // Using the configuration's MODEL_QUEUE_NAME value, create a new queue based on the model's configuration.
      // Give it a name that starts with a known prefix for easy recognition.
      MQQueue replyQueue = qMgr.accessQueue(details.getMODEL_QUEUE_NAME(), MQConstants.MQOO_INPUT_EXCLUSIVE, null, details.getDYNAMIC_QUEUE_PREFIX(), null);

      // If the creation of the replyQueue has succeeded, we need to put its name in the output message so the
      // responder knows where to send the reply
      String dynamicReplyQueueName = replyQueue.getName();
      logger.log(Level.INFO,"Opened dynamic reply-to queue: {0}", dynamicReplyQueueName);

      // Build the request message...
      MQMessage request = new MQMessage();
      request.format = MQConstants.MQFMT_STRING;
      request.replyToQueueName = dynamicReplyQueueName;

      // Say this is going to be a request, expecting a reply. Tell the responder how to set the
      // correlator for the response.
      request.messageType = MQConstants.MQMT_REQUEST;
      request.report = MQConstants.MQRO_COPY_MSG_ID_TO_CORREL_ID;

      String payload = "{\"Greeting\": \"Hello from Java Requester at " + Instant.now() + "\"}";
      request.writeString(payload);

      MQPutMessageOptions pmo = new MQPutMessageOptions();
      pmo.options = MQConstants.MQPMO_NO_SYNCPOINT;

      // ... and send it
      requestQueue.put(request, pmo);
      logger.log(Level.INFO,"Sent request message to queue: {0}", details.getQUEUE_NAME());

      // Wait for responses that match the output message, using the request's messageID as the
      // correlationID.
      // As this is the only application using the reply queue, we do not really need to filter
      // the responses by messageID or correlID. But this is a good pattern to use, for situations where
      // the reply queue might be being shared with other applications.
      boolean keepReading = true;
      byte[] correlId = request.messageId;
      BasicConsumer bc = new BasicConsumer();
      logger.log(Level.INFO,"Waiting for reply on: {0}", dynamicReplyQueueName.trim());

      // Read any responses until there is a failure - usually that no messages have appeared in the
      // wait interval.
      while (keepReading) {
        keepReading = bc.getMessage(replyQueue, correlId);
      }

    } catch (Exception e) {
      logger.logException(e);
    } finally {
      mqFunctions.close();
    }
    System.exit(Globals.getExitCode());
  }
}