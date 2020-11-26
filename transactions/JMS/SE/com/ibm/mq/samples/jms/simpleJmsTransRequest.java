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
import java.util.UUID;
import java.util.concurrent.TimeUnit;
//import java.util.Random;

import javax.jms.Destination;
import javax.jms.JMSConsumer;
import javax.jms.JMSContext;
import javax.jms.JMSException;
import javax.jms.JMSProducer;
import javax.jms.TextMessage;
import javax.jms.Message;
import javax.jms.TemporaryQueue;

import com.ibm.msg.client.jms.JmsConnectionFactory;
import com.ibm.msg.client.jms.JmsFactoryFactory;
import com.ibm.msg.client.wmq.WMQConstants;
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

public class simpleJmsTransRequest {

private static final Level LOGLEVEL = Level.ALL;
private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");

private static final int PORT = 1414;     // Listener port for your queue manager
private static final String CHANNEL = "DEV.APP.SVRCONN";     // Channel name
private static final String QMGR = "QM1";     // Queue manager name
private static final String APP_USER = "app";     // User name that application uses to connect to MQ
private static final String APP_PASSWORD = "passw0rd";     // Password that the application uses to connect to MQ
private static final String QUEUE_NAME = "DEV.QUEUE.1";     // Queue that the application uses to put and get messages to and from
private static final String MODEL_QUEUE_NAME = "DEV.APP.MODEL.QUEUE";

//private static Random random = new Random();

public static void main(String[] args) {
        initialiseLogging();
        //      mqConnectionVariables();
        logger.info("Put application is starting");

        JMSContext context = null;
        Destination destination = null;
        JMSProducer producer = null;

        JmsConnectionFactory connectionFactory = createJMSConnectionFactory();
        setJMSProperties(connectionFactory);
        logger.info("created connection factory");

        context = connectionFactory.createContext();
        logger.info("context created");
        destination = context.createQueue("queue:///" + QUEUE_NAME);
        try {
                ((MQDestination) destination).setTargetClient(WMQConstants.WMQ_CLIENT_NONJMS_MQ);
        } catch (JMSException e) {
                logger.info("MQDest cast didn't work");
        }
        logger.info("destination created");
        producer = context.createProducer();
        logger.info("producer created");

        long uniqueNumber = System.currentTimeMillis() % 1000;
        TextMessage message = context.createTextMessage("" + uniqueNumber);
        logger.info("Unique number is "+ uniqueNumber);
        try {

                message.setJMSExpiration(900000);

                logger.finest("Sending a request message");
                TemporaryQueue requestQueue = context.createTemporaryQueue();
                message.setJMSReplyTo(requestQueue);
                //message expiry after 20 secs
                producer.setTimeToLive(20*1000).send(destination, message);
                logger.info("listening for response");

                JMSConsumer consumer = context.createConsumer(requestQueue);
                logger.info("reply getter created");
                //consumer waits for response 5 extra seconds - means if the request message is taken up at the last minute, the consumer will have more time to wait for the response
                Message receivedMessage = consumer.receive(25*1000);
                if (null != receivedMessage) {
                        getAndDisplayMessageBody(receivedMessage);
                }
                else {
                        logger.warning("No response received after 25 secs, timed out");
                }
        } catch (JMSException e) {
                logger.warning("Got a JMS exception");
                logger.warning(e.getMessage());
        } catch (Exception e) {
                logger.warning(e.getMessage());
        }
}

public static String getHexString(byte[] b) throws Exception {
        String result = "";
        for (int i = 0; i < b.length; i++) {
                result += Integer.toString((b[i] & 0xff) + 0x100, 16).substring(1);
        }
        return result;
}

private static void getAndDisplayMessageBody(Message receivedMessage) {
        logger.warning("got a response");
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
                cf.setStringProperty(WMQConstants.WMQ_APPLICATIONNAME, "SimpleJmsTransRequest");
                cf.setBooleanProperty(WMQConstants.USER_AUTHENTICATION_MQCSP, true);
                cf.setStringProperty(WMQConstants.USERID, APP_USER);
                cf.setStringProperty(WMQConstants.PASSWORD, APP_PASSWORD);
                cf.setStringProperty(WMQConstants.WMQ_TEMPORARY_MODEL, MODEL_QUEUE_NAME);
        } catch (JMSException jmsex) {
                recordFailure(jmsex);
        }
        return;
}

private static void recordSuccess() {
        logger.info("SUCCESS");
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
        logger.finest("Logging initialised");
}

}
