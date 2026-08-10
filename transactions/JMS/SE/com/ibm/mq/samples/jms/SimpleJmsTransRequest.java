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

import java.util.logging.ConsoleHandler;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.ibm.mq.jakarta.jms.MQDestination;
import com.ibm.msg.client.jakarta.jms.JmsConnectionFactory;
import com.ibm.msg.client.jakarta.wmq.WMQConstants;

import jakarta.jms.Destination;
import jakarta.jms.JMSConsumer;
import jakarta.jms.JMSContext;
import jakarta.jms.JMSException;
import jakarta.jms.JMSProducer;
import jakarta.jms.Message;
import jakarta.jms.TemporaryQueue;
import jakarta.jms.TextMessage;

/**
 * A minimal and simple application for Point-to-point messagingm, request
 * response pattern, with a transaction.
 *
 * Application makes use of fixed literals, any customisations will require
 * re-compilation of this source file. Application assumes that the named queue
 * is empty prior to a run.
 *
 * Notes:
 *
 * API type: Jakarta JMS API
 *
 * Messaging domain: Point-to-point
 *
 * Provider type: IBM MQ
 *
 * Connection mode: Client connection
 *
 * JNDI in use: No
 *
 */

public class SimpleJmsTransRequest {

  private static final Level LOGLEVEL = Level.ALL;
  private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");

  public static void main(String[] args) {

    initialiseLogging();
    logger.info("Requester application is starting");

    JMSContext context = null;
    Destination destination = null;
    JMSProducer producer = null;

    try {
      JmsConnectionFactory connectionFactory = Common.createCF();

      context = connectionFactory.createContext();
      destination = context.createQueue("queue:///" + Common.QUEUE_NAME);

      ((MQDestination) destination).setTargetClient(WMQConstants.WMQ_CLIENT_NONJMS_MQ);

      producer = context.createProducer();

      long uniqueNumber = System.currentTimeMillis() % 1000;
      TextMessage message = context.createTextMessage("" + uniqueNumber);

      message.setJMSExpiration(900000);

      // Create a temporary reply queue
      TemporaryQueue requestQueue = context.createTemporaryQueue();
      message.setJMSReplyTo(requestQueue);

      // Send the message with expiry after 20 secs
      producer.setTimeToLive(20 * 1000).send(destination, message);

      JMSConsumer consumer = context.createConsumer(requestQueue);

      // consumer waits for response 5 extra seconds - means if the request message is
      // taken up at the last minute, the consumer will have more time to wait for the
      // response
      logger.info("Waiting for response");

      Message receivedMessage = consumer.receive(25 * 1000);
      if (null != receivedMessage) {
        getAndDisplayMessageBody(receivedMessage);
      } else {
        logger.warning("No response received after 25 secs, timed out");
        // This is expected, so do not generate error
      }
    } catch (JMSException e) {
      processJMSException(e);
      System.exit(1);
    } catch (Exception e) {
      logger.warning(e.getMessage());
      System.exit(1);
    }

    System.exit(0);
  }

  public static String getHexString(byte[] b) throws Exception {
    String result = "";
    for (int i = 0; i < b.length; i++) {
      result += Integer.toString((b[i] & 0xff) + 0x100, 16).substring(1);
    }
    return result;
  }

  private static void getAndDisplayMessageBody(Message receivedMessage) {
    logger.info("got a response");
    if (receivedMessage instanceof TextMessage) {
      TextMessage textMessage = (TextMessage) receivedMessage;
      try {
        logger.info("Received message: " + textMessage.getText());
      } catch (JMSException jmsex) {
        recordFailure(jmsex);
      }
    } else if (receivedMessage instanceof Message) {
      logger.info("Message received was not of type TextMessage.\n");
    } else {
      logger.info("Received object not of JMS Message type!\n");
    }
  }

  private static void recordFailure(Exception ex) {
    if (ex != null) {
      if (ex instanceof JMSException) {
        processJMSException((JMSException) ex);
      } else {
        logger.warning(ex.getMessage());
      }
    }
    logger.info("FAILURE");
    return;
  }

  private static void processJMSException(JMSException jmsex) {
    logger.warning(jmsex.getMessage());
    Throwable innerException = jmsex.getLinkedException();
    if (innerException != null) {
      logger.warning("Inner exception(s):");
    }
    while (innerException != null) {
      logger.warning(innerException.getMessage());
      innerException = innerException.getCause();
    }
    return;
  }

  private static void initialiseLogging() {
    Logger defaultLogger = Logger.getLogger("");
    Handler[] handlers = defaultLogger.getHandlers();
    if (handlers != null && handlers.length > 0) {
      defaultLogger.removeHandler(handlers[0]);
    }

    Handler consoleHandler = new ConsoleHandler();
    consoleHandler.setLevel(LOGLEVEL);
    logger.addHandler(consoleHandler);

    logger.setLevel(LOGLEVEL);
  }
}
