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

import java.util.logging.Level;
import java.util.logging.Logger;

import com.ibm.msg.client.jakarta.jms.DetailedInvalidDestinationException;

import jakarta.jms.DeliveryMode;
import jakarta.jms.Destination;
import jakarta.jms.JMSConsumer;
import jakarta.jms.JMSContext;
import jakarta.jms.JMSException;
import jakarta.jms.JMSProducer;
import jakarta.jms.JMSRuntimeException;
import jakarta.jms.Message;
import jakarta.jms.TextMessage;

public class BasicResponse {
  private static final Logger logger = LoggingHelper.getLogger(BasicResponse.class.getName());

  private static ConnectionHelper ch;
  private static Long SECOND = 1000L;
  private static Long HOUR = 60 * 60 * SECOND;
  private static Long RESPONDER_INACTIVITY_TIMEOUT = 3000L;

  public static void main(String[] args) {

    logger.info("Application \"Basic response\" is starting");

    try {
      runResponseApplication();
    } catch (Exception e) {
      JmsExceptionHelper.recordFailure(logger,e);
    }
    System.exit(JmsExceptionHelper.getExitCode());
  }

  private static void runResponseApplication() {
    JMSConsumer consumer;

    ch = new ConnectionHelper("Responder", ConnectionHelper.USE_CONNECTION_STRING, JMSContext.SESSION_TRANSACTED);
    JMSContext context = ch.getContext();

    Destination destination = ch.getDestination();
    logger.info("Created destination");

    consumer = context.createConsumer(destination);
    logger.log(Level.INFO, "Created consumer for destination {0}", destination);

    while (true) {
      try {
        Message receivedMessage = null;
        // getting the message from the requestor
        logger.log(Level.INFO, "Responder waiting for {0} milliseconds for next request",RESPONDER_INACTIVITY_TIMEOUT);
        receivedMessage = consumer.receive(RESPONDER_INACTIVITY_TIMEOUT);
        if (null == receivedMessage) {
          logger.info("Timed out with no requests received");
          logger.info("Terminating responder");
          break;
        }

        logger.info("Checking message type");

        getAndDisplayMessageBody(receivedMessage);
        replyToMessage(context, receivedMessage);
      } catch (JMSRuntimeException jmsex) {

        jmsex.printStackTrace();
        try {
          Thread.sleep(1000);
        } catch (InterruptedException e) {
        }
      }
    }
  }

  private static void replyToMessage(JMSContext context, Message receivedMessage) {
    logger.info("Preparing reply message");
    boolean ok=true;
    try {
      String requestObject = null;
      if (receivedMessage instanceof TextMessage) {
        TextMessage textMessage = (TextMessage) receivedMessage;
        requestObject = textMessage.getText();
      }

      if (receivedMessage instanceof Message) {

        Destination destination = receivedMessage.getJMSReplyTo();
        String correlationID = receivedMessage.getJMSCorrelationID();

        TextMessage message = context.createTextMessage(RequestResponseHelper.buildStringForResponse(requestObject));
        message.setJMSCorrelationID(correlationID);

        // Make sure message put on a reply queue is non-persistent so non XMS/JMS apps
        // can get the message off the temp reply queue
        // Reply will expire in an hour if not retrieved by the requester

        context.createProducer()
        .setDeliveryMode(DeliveryMode.NON_PERSISTENT)
        .setTimeToLive(HOUR)
        .send(destination, message);
        context.commit();

      }
      logger.info("Reply has been sent");
    } catch (JMSException | JMSRuntimeException jmsex) {
      JmsExceptionHelper.recordFailure(logger, jmsex);
      ok = false;

      // Get this exception when the reply to queue is no longer valid.
      // eg. When app that posted the message is no longer running.
      if (null != jmsex.getCause() && jmsex.getCause() instanceof DetailedInvalidDestinationException) {
        logger.info("ReplyTo destination is invalid");
        ok = false;
      }
    } catch (Exception e) {
      JmsExceptionHelper.recordFailure(logger, e);
      ok = false;
    }

    if (!ok) {
      rollbackOrPause(context,receivedMessage);
    }

  }

  // The MQ JMS client will automatically try to move messages that have been backed out too many times to
  // an alternative queue. That requires the BOTHRESH and BOQNAME attributes to have been set on the
  // target queue. This code attempts to do the same thing manually.
  //
  // There is no check here on the real queue's configuration is; we're going to assume that it is either not
  // set, or the BOTHRESH is larger than the threshold in this method.
  private static void rollbackOrPause(JMSContext context, Message message) {
    int backoutCounter = -1;
    int backoutThreshold = 3;

    try {
      backoutCounter = Integer.parseInt(message.getStringProperty("JMSXDeliveryCount"));
      logger.log(Level.INFO, "Current counter: {0}", String.valueOf(backoutCounter));
    } catch (Exception e) {
      logger.info("Error on getting the backout counter");
      return;
    }

    if(backoutCounter < backoutThreshold) {
      logger.warning("Rolling back the transaction");
      context.rollback();
    } else {
      logger.warning("Retry counter has been exceeded. Will attempt to move the message elsewhere");
      redirectToAnotherQueue(context, message);
    }
  }

  private static void redirectToAnotherQueue(JMSContext context, Message message) {
    logger.info("Redirecting message to backout queue");
    Destination backoutDest = ch.getBackoutQueue();
    if (backoutDest != null) {
      JMSProducer producer = context.createProducer();
      producer.send(backoutDest, message);
      logger.info("Message sent to backout queue correctly");
    }
    context.commit();
  }

  private static void getAndDisplayMessageBody(Message receivedMessage) {
    if (receivedMessage instanceof TextMessage) {
      TextMessage textMessage = (TextMessage) receivedMessage;
      try {
        logger.log(Level.INFO, "Received request message: {0} ", textMessage.getText());
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
