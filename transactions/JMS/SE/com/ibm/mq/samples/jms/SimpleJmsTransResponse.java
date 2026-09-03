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

import com.ibm.mq.MQException;
import com.ibm.mq.constants.MQConstants;
import com.ibm.msg.client.jakarta.jms.DetailedInvalidDestinationException;
import com.ibm.msg.client.jakarta.jms.JmsConnectionFactory;

import jakarta.jms.DeliveryMode;
import jakarta.jms.Destination;
import jakarta.jms.JMSConsumer;
import jakarta.jms.JMSContext;
import jakarta.jms.JMSException;
import jakarta.jms.JMSProducer;
import jakarta.jms.JMSRuntimeException;
import jakarta.jms.Message;
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

public class SimpleJmsTransResponse {

  private static final Level LOGLEVEL = Level.ALL;
  private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");

  public static void main(String[] args) {
    initialiseLogging();

    logger.info("Responder application is starting");

    JMSContext context = null;
    Destination destination = null;
    JMSConsumer consumer = null;
    try {
      JmsConnectionFactory connectionFactory = Common.createCF();

      context = connectionFactory.createContext(JMSContext.SESSION_TRANSACTED);
      destination = context.createQueue("queue:///" + Common.QUEUE_NAME);
      consumer = context.createConsumer(destination);
    } catch (JMSException jmsex) {
      recordFailure(jmsex);
      System.exit(1);
    }

    while (true) {
      try {
        // Wait for 10 seconds for a message to arrive
        Message receivedMessage = consumer.receive(10 * 1000L);
        if (receivedMessage == null) {
          break;
        }
        long extractedValue = getAndDisplayMessageBody(receivedMessage);
        // even though we're sending a reply, we haven't committed the transaction,
        // therefore if we hit rollback the reply message shouldn't be sent
        replyToMessage(context, receivedMessage, extractedValue);
        if (extractedValue % 2 == 0) {
          throw new Exception("Error generated because number is even");
        }
        context.commit();
      } catch (JMSRuntimeException jmsex) {
        context.rollback();
        jmsex.printStackTrace();
        try {
          Thread.sleep(1000);
        } catch (InterruptedException e) {
        }
      } catch (Exception ex) {
        ex.printStackTrace();
        context.rollback();
        try {
          Thread.sleep(1000);
        } catch (InterruptedException e) {
        }
      }
    }

    try {
      context.commit();
      context.stop();
      context.close();
    } catch (Exception e) {
      // Ignore errors
    }

    System.exit(0);
  }

  private static long getAndDisplayMessageBody(Message receivedMessage) {
    long responseValue = 0;
    if (receivedMessage instanceof TextMessage) {
      TextMessage textMessage = (TextMessage) receivedMessage;
      try {
        logger.info("Request message was " + textMessage.getText());
        responseValue = Long.parseLong(textMessage.getText());
        responseValue *= responseValue;
        logger.info("Response is " + responseValue);

      } catch (JMSException jmsex) {
        recordFailure(jmsex);
      }
    } else if (receivedMessage instanceof Message) {
      logger.info("Message received was not of type TextMessage.\n");
    } else {
      logger.info("Received object not of JMS Message type!\n");
    }
    return responseValue;
  }

  private static void replyToMessage(JMSContext context, Message receivedMessage, long extractedValue) {
    try {
      if (receivedMessage instanceof Message) {
        Destination destination = receivedMessage.getJMSReplyTo();
        String correlationID = receivedMessage.getJMSCorrelationID();
        TextMessage message = context.createTextMessage("your number is " + extractedValue);
        message.setJMSCorrelationID(correlationID);
        JMSProducer producer = context.createProducer();
        // Make sure message put on a reply queue is non-persistent so non XMS/JMS apps
        // can get the message off the temp reply queue
        producer.setDeliveryMode(DeliveryMode.NON_PERSISTENT);
        producer.send(destination, message);
      }
    } catch (JMSException jmsex) {
      logger.info("******** JMS Exception*********************");

      if (null != jmsex.getCause() && jmsex.getCause() instanceof MQException) {
        MQException innerException = (MQException) jmsex.getCause();

        if (MQConstants.MQRC_UNKNOWN_OBJECT_NAME == innerException.getReason()) {
          logger.info("Reply to Queue no longer exists, skipping request");
          return;
        }
      }

      logger.warning("Unexpected Expection replying to message");
      jmsex.printStackTrace();

    } catch (JMSRuntimeException jmsex) {
      // Get this exception when the message does not have a reply to queue.
      if (null != jmsex.getCause()) {
        MQException e = findMQException(jmsex);
        if (null != e && e instanceof MQException) {
          if (MQConstants.MQRC_UNKNOWN_OBJECT_NAME == e.getReason()) {
            logger.info("Reply to Queue no longer exists, skipping request");
            return;
          }
        }
      }

      // Get this exception when the reply to queue is no longer valid.
      // eg. When app that posted the message is no longer running.
      if (null != jmsex.getCause() && jmsex.getCause() instanceof DetailedInvalidDestinationException) {
        logger.info("Reply to destination is invalid");
        return;
      }

      logger.warning("Unexpected runtime error");
      jmsex.printStackTrace();
    }
  }

  // recurse on the inner exceptions looking for a MQException.
  private static MQException findMQException(Exception e) {
    Exception inner = (Exception) e.getCause();
    if (null != inner) {
      if (inner instanceof MQException) {
        logger.info("Found MQException");
        return (MQException) inner;
      } else {
        return findMQException(inner);
      }
    }
    return null;
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
    logger.info(jmsex.getMessage());
    Throwable innerException = jmsex.getLinkedException();
    logger.info("Exception is: " + jmsex);
    if (innerException != null) {
      logger.info("Inner exception(s):");
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
