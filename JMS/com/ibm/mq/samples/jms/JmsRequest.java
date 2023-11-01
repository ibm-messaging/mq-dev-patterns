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

import java.util.logging.*;
import java.util.UUID;
import java.util.Random;

// Use these imports for building with JMS
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
import com.ibm.msg.client.jms.DetailedInvalidDestinationException;
import com.ibm.mq.jms.MQDestination;

import com.ibm.msg.client.jms.DetailedInvalidDestinationRuntimeException;

// Use these imports for building with Jakarta Messaging
// import jakarta.jms.Destination;
// import jakarta.jms.JMSConsumer;
// import jakarta.jms.JMSContext;
// import jakarta.jms.JMSException;
// import jakarta.jms.JMSProducer;
// import jakarta.jms.TextMessage;
// import jakarta.jms.Message;
// import jakarta.jms.TemporaryQueue;

// import com.ibm.msg.client.jakarta.jms.JmsConnectionFactory;
// import com.ibm.msg.client.jakarta.jms.JmsFactoryFactory;
// import com.ibm.msg.client.jakarta.wmq.WMQConstants;
// import com.ibm.msg.client.jakarta.jms.DetailedInvalidDestinationException;
// import com.ibm.mq.jakarta.jms.MQDestination;

// import com.ibm.msg.client.jakarta.jms.DetailedInvalidDestinationRuntimeException;

import com.ibm.mq.samples.jms.SampleEnvSetter;

public class JmsRequest {

    private static final Level LOGLEVEL = Level.ALL;
    private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");

    // Create variables for the connection to MQ
    private static String ConnectionString; //= "localhost(1414),localhost(1416)"
    private static String CHANNEL; // Channel name
    private static String QMGR; // Queue manager name
    private static String APP_USER; // User name that application uses to connect to MQ
    private static String APP_PASSWORD; // Password that the application uses to connect to MQ
    private static String QUEUE_NAME; // Queue that the application uses to put messages to
    private static String REPLY_QUEUE_NAME; // Queue that the application uses to get messages replies from
    private static String MODEL_QUEUE_NAME; //
    private static String CIPHER_SUITE;
    private static String CCDTURL;
    private static Boolean BINDINGS = false;
    private static String REQUEST_MODE = "";

    private static Long REQUEST_MESSAGE_EXPIRY = 0L;

    private static Random random = new Random();

    private static Long SECOND = 1000L;
    private static Long HOUR = 60 * 60 * SECOND; 
    

    public static void main(String[] args) {
        initialiseLogging();
        mqConnectionVariables();
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

        // If messages will expire set appropriate time to live for messages
        // Otherwise ensure that they disappear off the queue in 2 hours
        if (0 < REQUEST_MESSAGE_EXPIRY) {
            producer.setTimeToLive(REQUEST_MESSAGE_EXPIRY);
        } else {
            producer.setTimeToLive(2 * HOUR);
        }

        logger.info("producer created");

        TextMessage message = context.createTextMessage(RequestResponseHelper.buildStringForRequest(REQUEST_MODE, random.nextInt(101)));
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
            logger.info(getHexString(b));

            message.setJMSExpiration(REQUEST_MESSAGE_EXPIRY);

            Destination requestQueue = null;

            if (null == REPLY_QUEUE_NAME || REPLY_QUEUE_NAME.isEmpty()) {
                logger.finest("Setting the reply to queue to a temporary queue");
                //TemporaryQueue requestQueue = context.createTemporaryQueue(); 
                requestQueue = context.createTemporaryQueue();   
            } else {
                logger.finest("Setting the reply to queue to " + REPLY_QUEUE_NAME);
                requestQueue = context.createQueue("queue:///" + REPLY_QUEUE_NAME);               
            }

            message.setJMSReplyTo(requestQueue);

            logger.finest("Sending a request message");
            producer.send(destination, message);
            logger.info("listening for response");

            logger.info("Selecting reply based on selector " + selector);
            JMSConsumer consumer = context.createConsumer(requestQueue, selector);
            logger.info("reply getter created");

            Message receivedMessage = null;
            if (0 < REQUEST_MESSAGE_EXPIRY){
                receivedMessage = consumer.receive(REQUEST_MESSAGE_EXPIRY);
            } else {
                receivedMessage = consumer.receive();
            }

            if (null != receivedMessage) {
                getAndDisplayMessageBody(receivedMessage);
            } else {
                logger.warning("Request has been timed out");
            }


        } catch (JMSException e) {
            logger.warning("Got a JMS exception");
            logger.warning(e.getMessage());
        } catch (DetailedInvalidDestinationRuntimeException e) {
            logger.warning("Looks like something is wrong with the queue name"); 
            logger.warning(e.getMessage());
        } catch (Exception e) {
            logger.warning("Got an exception");
            logger.warning("Exception class Name " + e.getClass().getSimpleName());
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

    private static void mqConnectionVariables() {
        SampleEnvSetter env = new SampleEnvSetter();
        int index = 0;

        ConnectionString = env.getConnectionString();
        CHANNEL = env.getEnvValue("CHANNEL", index);
        QMGR = env.getEnvValue("QMGR", index);
        APP_USER = env.getEnvValue("APP_USER", index);
        APP_PASSWORD = env.getEnvValue("APP_PASSWORD", index);
        QUEUE_NAME = env.getEnvValue("QUEUE_NAME", index);
        REPLY_QUEUE_NAME = env.getEnvValue("REPLY_QUEUE_NAME", index);
        MODEL_QUEUE_NAME = env.getEnvValue("MODEL_QUEUE_NAME", index);
        CIPHER_SUITE = env.getEnvValue("CIPHER_SUITE", index);
        BINDINGS = env.getEnvBooleanValue("BINDINGS", index);

        REQUEST_MODE = env.getEnvValue("REQUEST_MODE", index);

        REQUEST_MESSAGE_EXPIRY = env.getEnvLongValue("REQUEST_MESSAGE_EXPIRY", index);

        // Expiry is in milliseconds, a value of 5 will be converted to 
        // 5000 milliseconds = 5 seconds.
        if (0 < REQUEST_MESSAGE_EXPIRY) {
            REQUEST_MESSAGE_EXPIRY *= SECOND;
        } else {
            REQUEST_MESSAGE_EXPIRY = 900000L;
        }

        CCDTURL = env.getCheckForCCDT();
    }

    private static JmsConnectionFactory createJMSConnectionFactory() {
        JmsFactoryFactory ff;
        JmsConnectionFactory cf;
        try {
            // JMS
            ff = JmsFactoryFactory.getInstance(WMQConstants.WMQ_PROVIDER);
            // Jakarta
            // ff = JmsFactoryFactory.getInstance(WMQConstants.JAKARTA_WMQ_PROVIDER);

            cf = ff.createConnectionFactory();
        } catch (JMSException jmsex) {
            recordFailure(jmsex);
            cf = null;
        }
        return cf;
    }

    private static void setJMSProperties(JmsConnectionFactory cf) {
        try {
            if (null == CCDTURL) {
                cf.setStringProperty(WMQConstants.WMQ_CONNECTION_NAME_LIST, ConnectionString);
                if (null == CHANNEL && !BINDINGS) {
                    logger.warning("When running in client mode, either channel or CCDT must be provided");
                } else if (null != CHANNEL) {
                    cf.setStringProperty(WMQConstants.WMQ_CHANNEL, CHANNEL);
                }
            } else {
                logger.info("Will be making use of CCDT File " + CCDTURL);
                cf.setStringProperty(WMQConstants.WMQ_CCDTURL, CCDTURL);
            }

            if (BINDINGS) {
                cf.setIntProperty(WMQConstants.WMQ_CONNECTION_MODE, WMQConstants.WMQ_CM_BINDINGS);
            } else {
                cf.setIntProperty(WMQConstants.WMQ_CONNECTION_MODE, WMQConstants.WMQ_CM_CLIENT);
            }

            cf.setStringProperty(WMQConstants.WMQ_QUEUE_MANAGER, QMGR);
            cf.setStringProperty(WMQConstants.WMQ_APPLICATIONNAME, "JmsRequest");
            if (null != APP_USER && !APP_USER.trim().isEmpty()) {
                cf.setBooleanProperty(WMQConstants.USER_AUTHENTICATION_MQCSP, true);
                cf.setStringProperty(WMQConstants.USERID, APP_USER);
                cf.setStringProperty(WMQConstants.PASSWORD, APP_PASSWORD);
            }
            cf.setStringProperty(WMQConstants.WMQ_TEMPORARY_MODEL, MODEL_QUEUE_NAME);
            if (CIPHER_SUITE != null && !CIPHER_SUITE.isEmpty()) {
                cf.setStringProperty(WMQConstants.WMQ_SSL_CIPHER_SUITE, CIPHER_SUITE);
            }
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
