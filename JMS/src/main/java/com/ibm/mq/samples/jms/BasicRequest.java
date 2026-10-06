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

/*
 * This program is half the implemention of a request/response pattern.
 * This piece sends a message, and then uses the CorrelationId to wait for a response.
 *
 * See BasicResponse for the partner program.
 */

public class BasicRequest {

  private static final Logger logger = LoggingHelper.getLogger(BasicRequest.class.getName());

  private static Long TIMEOUT = 3000L; // We will wait for 3 seconds for a reply
  private static Random random = new Random();

  public static void main(String[] args) {
    JMSConsumer consumer = null;
    Destination replyQueue = null;

    logger.info("Application \"Basic request\" is starting");

    ConnectionHelper ch = new ConnectionHelper("Requester", ConnectionHelper.USE_CONNECTION_STRING, JMSContext.SESSION_TRANSACTED);
    JMSContext context = ch.getContext();
    Destination destination = ch.getQueue();

    ch.setTargetClient(destination);

    logger.log(Level.INFO, "Created destination: {0}",destination);
    JMSProducer producer = context.createProducer();


    // Set the messages to expire if they are not processed within the WaitInterval.
    // Using twice the timeout seems a reasonable value. The TimetToLive applies to
    // all messages from this Producer.
    producer.setTimeToLive(2 * TIMEOUT);

    logger.info("Created producer");

    /* Create the body of the message and a known CorrelationId
       The CorrelId follows the underlying MQI format of 24 bytes. Other
       patterns can be used to provide the relationship between request and response. All
       rely on the responder agreeing on the model to use. For example, to copy the inbound
       MsgId into the outbound CorrelId.
     */
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

      // Create a temporary queue and designate that as where replies have to be sent.
      replyQueue = context.createTemporaryQueue();
      message.setJMSReplyTo(replyQueue);

      logger.info("Sending a request message");
      producer.send(destination, message);

      // As we are using a transacted session, we have to commit the request
      // before it is actually sent
      context.commit();

      // Access the reply queue, using a selector that will only return messages that match the filter.
      // In this case, the CorrelationId.
      logger.log(Level.INFO, "Created consumer for reply queue based on selector: {0}", selector);
      consumer = context.createConsumer(replyQueue, selector);

      Message receivedMessage = null;
      receivedMessage = consumer.receive(TIMEOUT);

      // commiting response consumption
      context.commit();

      if (null != receivedMessage) {
        processMessage(receivedMessage);
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

  private static void processMessage(Message receivedMessage){
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
}
