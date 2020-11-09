/*
 * (c) Copyright IBM Corporation 2019
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

import java.util.logging.*;
import javax.jms.Destination;
import javax.jms.JMSConsumer;
import javax.jms.JMSContext;
import javax.jms.JMSException;
import javax.jms.JMSProducer;
import javax.jms.Message;
import javax.jms.TextMessage;
import javax.jms.JMSRuntimeException;
import javax.jms.DeliveryMode;

import com.ibm.msg.client.jms.JmsConnectionFactory;
import com.ibm.msg.client.jms.JmsFactoryFactory;
import com.ibm.msg.client.wmq.WMQConstants;
import com.ibm.mq.constants.MQConstants;
import com.ibm.mq.MQException;
import com.ibm.msg.client.jms.DetailedInvalidDestinationException;
import com.ibm.mq.jms.MQDestination;

/**
 * A minimal and simple application for Point-to-point messagingm, request response pattern, with a transaction.
 *
 * Application makes use of fixed literals, any customisations will require
 * re-compilation of this source file. Application assumes that the named queue
 * is empty prior to a run.
 *
 * Notes:
 *
 * API type: JMS API (v2.0, simplified domain)
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

public class simpleJmsTransResponse {

private static final Level LOGLEVEL = Level.ALL;
private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");

private static final int PORT = 1414;     // Listener port for your queue manager
private static final String CHANNEL = "DEV.APP.SVRCONN";     // Channel name
private static final String QMGR = "QM1";     // Queue manager name
private static final String APP_USER = "app";     // User name that application uses to connect to MQ
private static final String APP_PASSWORD = "passw0rd";     // Password that the application uses to connect to MQ
private static final String QUEUE_NAME = "DEV.QUEUE.1";     // Queue that the application uses to put and get messages to and from
private static final String MODEL_QUEUE_NAME = "DEV.APP.MODEL.QUEUE";

public static void main(String[] args) {
        initialiseLogging();

        logger.info("Put application is starting");

        JMSContext context;
        Destination destination;
        JMSConsumer consumer;

        JmsConnectionFactory connectionFactory = createJMSConnectionFactory();
        setJMSProperties(connectionFactory);
        logger.info("created connection factory");

        context = connectionFactory.createContext(JMSContext.SESSION_TRANSACTED);
        logger.info("context created");
        destination = context.createQueue("queue:///" + QUEUE_NAME);
        logger.info("destination created");
        consumer = context.createConsumer(destination);
        logger.info("consumer created");

        while (true) {
                try {
                        Message receivedMessage = consumer.receive();
                        long extractedValue = getAndDisplayMessageBody(receivedMessage);
// even though we're sending a reply, we haven't committed the transaction, therefore if we hit rollback the reply message shouldn't be sent
                        replyToMessage(context, receivedMessage, extractedValue);
                        if (extractedValue %2 == 0) {
                                throw new Exception("error generated");
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

private static JmsConnectionFactory createJMSConnectionFactory() {
        JmsFactoryFactory ff;
        JmsConnectionFactory cf;
        try {
                ff = JmsFactoryFactory.getInstance(WMQConstants.WMQ_PROVIDER);
                cf = ff.createConnectionFactory();
        } catch (JMSException jmsex) {
                recordFailure(jmsex);
                cf = null;
        }
        return cf;
}

private static void setJMSProperties(JmsConnectionFactory cf) {
        try {
                cf.setStringProperty(WMQConstants.WMQ_CHANNEL, CHANNEL);
                cf.setIntProperty(WMQConstants.WMQ_CONNECTION_MODE, WMQConstants.WMQ_CM_CLIENT);
                cf.setStringProperty(WMQConstants.WMQ_QUEUE_MANAGER, QMGR);
                cf.setStringProperty(WMQConstants.WMQ_APPLICATIONNAME, "SimpleJmsTransResponse");
                cf.setBooleanProperty(WMQConstants.USER_AUTHENTICATION_MQCSP, true);
                cf.setStringProperty(WMQConstants.USERID, APP_USER);
                cf.setStringProperty(WMQConstants.PASSWORD, APP_PASSWORD);

        } catch (JMSException jmsex) {
                recordFailure(jmsex);
        }
        return;
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
        logger.finest("Logging initialised");
}

}
