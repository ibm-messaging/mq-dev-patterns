/*
 * (c) Copyright IBM Corporation 2019, 2023
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

package com.ibm.mq.samples.jms;

import java.util.logging.Level;
import java.util.logging.Logger;

// Use these imports for building with Jakarta Messaging
import jakarta.jms.Destination;
import jakarta.jms.JMSConsumer;
import jakarta.jms.JMSContext;
import jakarta.jms.JMSRuntimeException;
import jakarta.jms.Message;


public class BasicConsumer {
  private static final Logger logger = LoggingHelper.getLogger(BasicConsumer.class.getName());

  public static final String CONSUMER_SUB = "topic";
  public static final String CONSUMER_GET = "queue";

  private JMSContext context = null;
  private Destination destination = null;
  private JMSConsumer consumer = null;
  private ConnectionHelper ch = null;

  public BasicConsumer(String type, int index) {
    String id = null;

    switch(type){
    case CONSUMER_SUB :
      id = "Basic sub";
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
      destination = ch.getTopicDestination();
      break;
    case CONSUMER_GET :
      destination = ch.getDestination();
      break;
    }

    logger.log(Level.INFO, "Created destination: {0}",destination);
  }

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
          new ConsumerHelper(receivedMessage);
        }
      } catch (JMSRuntimeException jmsex) {
        JmsExceptionHelper.recordFailure(logger,jmsex);
      }
    }
  }

  public void close() {
    consumer.close();
    ch.closeContext();
    consumer = null;
    ch = null;
  }

  private void waitAWhile(int duration) {
    try {
      Thread.sleep(duration);
    } catch (InterruptedException e) {
    }
  }
}
