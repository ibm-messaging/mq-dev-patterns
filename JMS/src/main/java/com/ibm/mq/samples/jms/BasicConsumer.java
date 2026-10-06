/*
 * (c) Copyright IBM Corporation 2019, 2026
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

/*
 * This class provides a common implementation for receiving both queue and topic-based
 * messages.
 *
 */
package com.ibm.mq.samples.jms;

import java.util.logging.Level;
import java.util.logging.Logger;

import jakarta.jms.Destination;
import jakarta.jms.JMSConsumer;
import jakarta.jms.JMSContext;
import jakarta.jms.JMSException;
import jakarta.jms.JMSRuntimeException;
import jakarta.jms.Message;
import jakarta.jms.TextMessage;


public class BasicConsumer {
  private static final Logger logger = LoggingHelper.getLogger(BasicConsumer.class.getName());

  public static final String CONSUMER_SUB = "topic";
  public static final String CONSUMER_GET = "queue";

  private JMSContext context = null;
  private Destination destination = null;
  private JMSConsumer consumer = null;
  private ConnectionHelper ch = null;

  /*
   * Get access to a destination - either a queue, or a topic.
   * The index value can be used to select from a list of configured
   * queue manager endpoints.
   */
  public BasicConsumer(String type, int index) {
    String id = null;

    switch(type){
    case CONSUMER_SUB :
      id = "Basic Sub";
      break;
    case CONSUMER_GET :
      id = "Basic Get";
      break;
    }
    logger.log(Level.INFO, "Application \"{0}\" is starting", id);

    ch = new ConnectionHelper(id, index);
    context = ch.getContext();

    switch(type){
    case CONSUMER_SUB :
      destination = ch.getTopic();
      break;
    case CONSUMER_GET :
      destination = ch.getQueue();
      break;
    }

    logger.log(Level.INFO, "Created destination: {0}",destination);
  }

  /*
   * Receive messages from the destination until no more are
   * available within the timeout period
   */
  public void receive(int requestTimeout) {
    boolean continueProcessing = true;

    consumer = context.createConsumer(destination);
    logger.info("Created consumer");

    while (continueProcessing) {
      try {
        logger.log(Level.INFO, "Waiting for message with timeout {0}ms", requestTimeout);

        Message receivedMessage = consumer.receive(requestTimeout);
        if (receivedMessage == null) {
          logger.info("No message received from this endpoint");
          continueProcessing = false;
        } else {
          processMessage(receivedMessage);
        }
      } catch (JMSRuntimeException jmsex) {
        JmsExceptionHelper.recordFailure(logger,jmsex);
      }
    }
  }

  private void processMessage(Message receivedMessage){
    if (receivedMessage instanceof TextMessage) {
      TextMessage textMessage = (TextMessage) receivedMessage;
      try {
        logger.log(Level.INFO, "Received message: {0}", textMessage.getText());
      } catch (JMSException jmsex) {
        JmsExceptionHelper.recordFailure(logger, jmsex);
      }
    } else if (receivedMessage instanceof Message) {
      logger.info("Received message was not of type TextMessage");
    } else {
      logger.info("Received object was not a JMS Message");
    }
  }

  /*
   * Explicitly cleanup resources we might have opened
   */
  public void close() {
    if (consumer != null)  {
      consumer.close();
    }
    if (ch != null) {
      ch.closeContext();
    }
    consumer = null;
    ch = null;
  }

}
