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

/*
 * This program is half the implemention of a request/response pattern.
 * This piece waits for a message, and then sends a response with the same
 * CorrelationId
 *
 * See BasicRequest for the partner program.
 */

public class BasicResponse {
  private static final Logger logger = LoggingHelper.getLogger(BasicResponse.class.getName());

  private static ConnectionHelper ch;
  private static Long TIMEOUT = 3 * 1000L;

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

    Destination destination = ch.getQueue();
    logger.info("Created destination");

    consumer = context.createConsumer(destination);
    logger.log(Level.INFO, "Created consumer for destination {0}", destination);

    // Loop on receiving messages until there are no more.
    while (true) {
      try {
        Message receivedMessage = null;

        // getting the message from the requestor
        logger.log(Level.INFO, "Responder waiting for {0} milliseconds for next request",TIMEOUT);
        receivedMessage = consumer.receive(TIMEOUT);
        if (null == receivedMessage) {
          logger.info("Timed out with no requests received");
          logger.info("Terminating responder");
          break;
        }

        logger.info("Checking message type");

        processMessage(receivedMessage);
        sendReplyMessage(context, receivedMessage);
      } catch (JMSRuntimeException jmsex) {

        jmsex.printStackTrace();
        try {
          Thread.sleep(1000);
        } catch (InterruptedException e) {
        }
      }
    }
  }

  private static void sendReplyMessage(JMSContext context, Message receivedMessage) {
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

        // Create the body of the message
        TextMessage message = context.createTextMessage(RequestResponseHelper.buildStringForResponse(requestObject));
        // Set the CorrelationId to be the same as the inbound messages. That allows the requester to wait
        // for the specific response.
        message.setJMSCorrelationID(correlationID);

        // Make sure message put on a reply queue is non-persistent as that is all that is
        // accepted on temporary dynamic queues.
        // Reply will expire if not retrieved by the requester
        context.createProducer()
        .setDeliveryMode(DeliveryMode.NON_PERSISTENT)
        .setTimeToLive(2 * TIMEOUT)
        .send(destination, message);

        // The context is transacted, so we need to explicitly commit the message. This will also complete
        // the removal of the inbound message, received in the same transaction.
        context.commit();

      }
      logger.info("Reply has been sent");
    } catch (JMSException | JMSRuntimeException jmsex) {
      JmsExceptionHelper.recordFailure(logger, jmsex);
      ok = false;

      // This exception is generated when the reply queue is no longer valid.
      // For example, when the app that posted the message is no longer running, its dynamic reply queue
      // gets deleted.
      if (null != jmsex.getCause() && jmsex.getCause() instanceof DetailedInvalidDestinationException) {
        logger.info("ReplyTo destination is invalid");
      }
    } catch (Exception e) {
      JmsExceptionHelper.recordFailure(logger, e);
      ok = false;
    }

    // If there's been an error, try to rollback the operations and try again after
    // a short delay in case the error was transient.
    if (!ok) {
      rollbackOrPause(context,receivedMessage);
    }
  }

  // The MQ JMS client will automatically try to move messages that have been backed out too many times to
  // an alternative queue. That requires the BOTHRESH and BOQNAME attributes to have been set on the
  // target queue. This code attempts to do the same thing explicitly.
  //
  // There is no check here on the real queue's configuration. We're going to assume that it is either not
  // set, or the BOTHRESH is larger than the threshold in this method.
  private static void rollbackOrPause(JMSContext context, Message message) {
    int backoutCounter = -1;
    int backoutThreshold = 3;

    try {
      backoutCounter = Integer.parseInt(message.getStringProperty("JMSXDeliveryCount"));
      logger.log(Level.INFO, "Current backout counter: {0}", String.valueOf(backoutCounter));
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
