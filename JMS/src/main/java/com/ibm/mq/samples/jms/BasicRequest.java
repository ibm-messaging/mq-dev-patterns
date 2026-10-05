/*
 * (c) Copyright IBM Corporation 2019, 2024
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

import java.util.HexFormat;
import java.util.Random;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

import jakarta.jms.Destination;
import jakarta.jms.JMSConsumer;
import jakarta.jms.JMSContext;
import jakarta.jms.JMSException;
import jakarta.jms.JMSProducer;
import jakarta.jms.Message;
import jakarta.jms.TemporaryQueue;
import jakarta.jms.TextMessage;

public class BasicRequest {

  private static final Logger logger = LoggingHelper.getLogger(BasicRequest.class.getName());

  private static Long REQUEST_MESSAGE_EXPIRY = 3000L; // 3 seconds

  private static Random random = new Random();

  private static Long SECOND = 1000L;
  private static Long HOUR = 60 * 60 * SECOND;

  public static void main(String[] args) {
    JMSConsumer consumer = null;
    Destination replyQueue = null;

    logger.info("Application \"Basic request\" is starting");

    ConnectionHelper ch = new ConnectionHelper("Requester", ConnectionHelper.USE_CONNECTION_STRING, JMSContext.SESSION_TRANSACTED);
    JMSContext context = ch.getContext();
    Destination destination = ch.getDestination();

    ch.setTargetClient(destination);

    logger.log(Level.INFO, "Created destination: {0}",destination);
    JMSProducer producer = context.createProducer();

    // If messages will expire set appropriate time to live for messages
    // Otherwise ensure that they disappear off the queue in 2 hours
    if (0 < REQUEST_MESSAGE_EXPIRY) {
      producer.setTimeToLive(REQUEST_MESSAGE_EXPIRY);
    } else {
      producer.setTimeToLive(2 * HOUR);
    }

    logger.info("Created producer");

    TextMessage message = context.createTextMessage(RequestResponseHelper.buildStringForRequest(RequestResponseHelper.MODE_DEFAULT, random.nextInt(101)));
    try {
      String correlationID = String.format("%24.24s", UUID.randomUUID().toString());
      byte[] b = null;
      String selector = "";
      try {
        b = correlationID.getBytes();
        selector = "JMSCorrelationID='ID:" + getHexString(b) + "'";
      } catch (Exception e) {
        logger.info(e.getMessage());
      }
      message.setJMSCorrelationIDAsBytes(b);
      message.setJMSExpiration(REQUEST_MESSAGE_EXPIRY);

      replyQueue = context.createTemporaryQueue();
      message.setJMSReplyTo(replyQueue);

      logger.info("Sending a request message");
      producer.send(destination, message);
      // committing request to request queue
      context.commit();

      logger.log(Level.INFO, "Created consumer for reply queue based on selector: {0}", selector);
      consumer = context.createConsumer(replyQueue, selector);

      Message receivedMessage = null;
      if (0 < REQUEST_MESSAGE_EXPIRY){
        receivedMessage = consumer.receive(REQUEST_MESSAGE_EXPIRY);
      } else {
        receivedMessage = consumer.receive();
      }

      // commiting response consumption
      context.commit();

      if (null != receivedMessage) {
        getAndDisplayMessageBody(receivedMessage);
      } else {
        logger.warning("Request has timed out");
      }
    } catch (Exception e) {
      JmsExceptionHelper.recordFailure(logger,e);
    } finally {
      try {
        if (consumer != null) {
          consumer.close();
        }
        if (replyQueue != null) {
          ((TemporaryQueue) replyQueue).delete();
        }
        ch.closeContext();
      } catch (Exception e) {
        // Do nothing if there are errors during cleanup
      }
    }


    System.exit(JmsExceptionHelper.getExitCode());
  }

  public static String getHexString(byte[] b) throws Exception {
    return (b==null)?"": HexFormat.of().formatHex(b);
  }

  private static void getAndDisplayMessageBody(Message receivedMessage) {
    if (receivedMessage instanceof TextMessage) {
      TextMessage textMessage = (TextMessage) receivedMessage;
      try {
        logger.log(Level.INFO, "Received response message: {0}", textMessage.getText());
      } catch (JMSException jmsex) {
        JmsExceptionHelper.recordFailure(logger,jmsex);
      }
    } else if (receivedMessage instanceof Message) {
      logger.info("Received message was not of type TextMessage");
    } else {
      logger.info("Received object was not a JMS Message");
    }
  }
}
