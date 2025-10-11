/*
* (c) Copyright IBM Corporation 2019, 2025
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

// Use these imports for building with JMS
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
import com.ibm.msg.client.jms.DetailedInvalidDestinationException;
import com.ibm.msg.client.jms.DetailedInvalidDestinationRuntimeException;

import com.ibm.mq.jms.MQDestination;

// Use these imports for building with Jakarta Messaging
// import jakarta.jms.Destination;
// import jakarta.jms.JMSConsumer;
// import jakarta.jms.JMSContext;
// import jakarta.jms.JMSException;
// import jakarta.jms.JMSProducer;
// import jakarta.jms.Message;
// import jakarta.jms.TextMessage;
// import jakarta.jms.JMSRuntimeException;
// import jakarta.jms.DeliveryMode;

// import com.ibm.msg.client.jakarta.jms.JmsConnectionFactory;
// import com.ibm.msg.client.jakarta.jms.JmsFactoryFactory;
// import com.ibm.msg.client.jakarta.wmq.WMQConstants;
// import com.ibm.msg.client.jakarta.jms.DetailedInvalidDestinationException;
// import com.ibm.msg.client.jakarta.jms.DetailedInvalidDestinationRuntimeException;

// import com.ibm.mq.jakarta.jms.MQDestination;

import com.ibm.mq.constants.MQConstants;
import com.ibm.mq.MQException;


import com.ibm.mq.samples.jms.SampleEnvSetter;
import com.ibm.mq.samples.jms.JwtHelper;
import com.ibm.mq.samples.jms.LoggingHelper;

public class JmsResponse {
    private static final String DEFAULT_APP_NAME = "Dev Experience JmsResponse";
    private static final Level LOGLEVEL = Level.ALL;
    private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");

    // Create variables for the connection to MQ
    private static String ConnectionString; //= "localhost(1414),localhost(1416)"
    private static String CHANNEL; // Channel name
    private static String QMGR; // Queue manager name
    private static String APP_USER; // User name that application uses to connect to MQ
    private static String APP_PASSWORD; // Password that the application uses to connect to MQ
    private static String APP_NAME; // Application Name that the application uses
    private static String QUEUE_NAME; // Queue that the application uses to put and get messages to and from
    private static String CIPHER_SUITE;
    private static String CCDTURL;
    private static String BACKOUT_QUEUE;
    private static Boolean BINDINGS = false;
    private static Long RESPONDER_INACTIVITY_TIMEOUT = 0L;
    private static JwtHelper jh = null;
    private static String accessToken = null;
    private static Long SECOND = 1000L;
    private static Long HOUR = 60 * 60 * SECOND; 

    public static void main(String[] args) {
        LoggingHelper.init(logger);
        SampleEnvSetter env = new SampleEnvSetter();
        jh = new JwtHelper(env);
        if (jh.isJwtEnabled()) {
            accessToken = jh.obtainToken();
        } else {
            logger.info("One or more JWT Credentials missing! Will not be using JWT for authentication");
        }
        mqConnectionVariables(env);
        logger.info("Response application is starting");
    
        try {
            runResponseApplication();
        } catch (DetailedInvalidDestinationRuntimeException e) {
            logger.warning("Looks like queue name is invalid");
            logger.warning(e.getMessage());
        } catch (Exception e) {
            logger.warning("Got an exception");
            logger.warning("Exception class Name " + e.getClass().getSimpleName());
            logger.warning(e.getMessage());
        }
    }

    private static void runResponseApplication() {
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
                Message receivedMessage = null;
                // getting the message from the requestor
                if (0 < RESPONDER_INACTIVITY_TIMEOUT) {
                    logger.info("Responder waiting for " + RESPONDER_INACTIVITY_TIMEOUT + " milliseconds for next request");
                    receivedMessage = consumer.receive(RESPONDER_INACTIVITY_TIMEOUT); 
                    if (null == receivedMessage) {
                        logger.info("Timed out with no requests received");
                        logger.info("Terminating responder");
                        break;
                    }
                } else {
                    receivedMessage = consumer.receive();
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
        logger.info("Preparing reply to message");
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
        } catch (JMSException jmsex) {    
            logger.info("JMS Exception caught");

            Throwable cause = jmsex.getCause();

            if (null != cause && cause instanceof MQException) {
                MQException innerException = (MQException) cause;
                int reason = innerException.getReason();

                switch(innerException.getReason()) {
                    case MQConstants.MQRC_UNKNOWN_OBJECT_NAME:
                        logger.info("Reply to Queue no longer exists, skipping request");
                        break;
                    case MQConstants.MQRC_CONNECTION_BROKEN:
                        logger.info("MQ Connection has broken");
                        break;                    
                }
            }
            
            logger.warning("Unexpected Expection replying to message");            
            ok = false;
           // jmsex.printStackTrace();

        } catch (JMSRuntimeException jmsex) {
            logger.info("JMSRuntimeException caught");
            // Get this exception when the message does not have a reply to queue.
            if (null != jmsex.getCause()) {
                MQException e = findMQException(jmsex);
                if (null != e && e instanceof MQException) {
                    if (MQConstants.MQRC_UNKNOWN_OBJECT_NAME == e.getReason()) {
                        logger.info("Reply to Queue no longer exists, skipping request");
                        ok = false;                      
                    }
                }
            }

            // Get this exception when the reply to queue is no longer valid.
            // eg. When app that posted the message is no longer running.
            if (null != jmsex.getCause() && jmsex.getCause() instanceof DetailedInvalidDestinationException) {
                logger.info("Reply to destination is invalid");
                ok = false;          
            }   

            logger.warning("Unexpected runtime error");
            ok = false;
            //jmsex.printStackTrace();
        } catch (Exception e) {
            logger.warning("Got an unexpected exception");
            logger.warning("Exception class Name " + e.getClass().getSimpleName());
            logger.warning(e.getMessage());
            ok = false;
        }

        if (!ok) {
            rollbackOrPause(context,receivedMessage);
        }
        
    }

    private static void rollbackOrPause(JMSContext context, Message message) {
        int backoutCounter = -1;
        int backoutThreshold = 5;

        try {
            backoutCounter = Integer.parseInt(message.getStringProperty("JMSXDeliveryCount"));
            logger.info("Current counter " + String.valueOf(backoutCounter));
        } catch (Exception e) {
            logger.info("Error on getting the counter");
            return;
        }

        if(backoutCounter < backoutThreshold) {
            logger.warning("rolling back the message");
            context.rollback();
        } else {
            logger.warning("Retry rate has been exceeded");
            logger.warning("Attempting to backout the message");
            redirectToAnotherQueue(context, message);
        }      
    }

    private static void redirectToAnotherQueue(JMSContext context, Message message) {
        if (null == BACKOUT_QUEUE || BACKOUT_QUEUE.isEmpty()) {
            logger.warning("backout queue has not been supplied");
            logger.warning("message may cause poison message situation");
            context.commit();
            return;
        }
        logger.info("Redirecting to "+ BACKOUT_QUEUE);
        Destination dest = context.createQueue("queue:///" + BACKOUT_QUEUE);
        JMSProducer producer = context.createProducer();
        producer.send(dest, message);
        logger.info("Message sent to backout queue" + BACKOUT_QUEUE + " correctly");
        context.commit();
    }

    private static void getAndDisplayMessageBody(Message receivedMessage) {
        if (receivedMessage instanceof TextMessage) {
            TextMessage textMessage = (TextMessage) receivedMessage;
            try {
                logger.info("Request message was " + textMessage.getText());
            } catch (JMSException jmsex) {
                recordFailure(jmsex);
            }
        } else if (receivedMessage instanceof Message) {
            logger.info("Message received was not of type TextMessage.\n");
        } else {
            logger.info("Received object not of JMS Message type!\n");
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

    private static void mqConnectionVariables(SampleEnvSetter env) {
        int index = 0;

        CCDTURL = env.getCheckForCCDT();

        // If the CCDT is in use then a connection string will 
        // not be needed.
        if (null == CCDTURL) {
            ConnectionString = env.getConnectionString();
        }

        CHANNEL = env.getEnvValue("CHANNEL", index);
        QMGR = env.getEnvValue("QMGR", index);
        if (accessToken == null) {
            APP_USER = env.getEnvValue("APP_USER", index);
            APP_PASSWORD = env.getEnvValue("APP_PASSWORD", index);
        }
        APP_NAME = env.getEnvValueOrDefault("APP_NAME", DEFAULT_APP_NAME, index);
        QUEUE_NAME = env.getEnvValue("QUEUE_NAME", index);
        CIPHER_SUITE = env.getEnvValue("CIPHER_SUITE", index);
        BINDINGS = env.getEnvBooleanValue("BINDINGS", index);
        BACKOUT_QUEUE = env.getEnvValue("BACKOUT_QUEUE", index);
        RESPONDER_INACTIVITY_TIMEOUT = env.getEnvLongValue("RESPONDER_INACTIVITY_TIMEOUT", index);

        // TIMEOUT in receive is in milliseconds, a value of 5 will be converted to 
        // 5000 milliseconds = 5 seconds.
        if (0 < RESPONDER_INACTIVITY_TIMEOUT) {
            RESPONDER_INACTIVITY_TIMEOUT *= 1000;
        }

        if ( BACKOUT_QUEUE == null || BACKOUT_QUEUE.isEmpty() ) { 
            logger.info("Missing BACKOUT_QUEUE value"); 
        }
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

                // Set the WMQ_CLIENT_RECONNECT_OPTIONS property to allow 
                // the MQ JMS classes to attempt a reconnect 
                // cf.setIntProperty(WMQConstants.WMQ_CLIENT_RECONNECT_OPTIONS, WMQConstants.WMQ_CLIENT_RECONNECT);
            }

            if (BINDINGS) {
                cf.setIntProperty(WMQConstants.WMQ_CONNECTION_MODE, WMQConstants.WMQ_CM_BINDINGS);
            } else {
                cf.setIntProperty(WMQConstants.WMQ_CONNECTION_MODE, WMQConstants.WMQ_CM_CLIENT);
            }

            cf.setStringProperty(WMQConstants.WMQ_QUEUE_MANAGER, QMGR);
            cf.setStringProperty(WMQConstants.WMQ_APPLICATIONNAME, APP_NAME);
            cf.setBooleanProperty(WMQConstants.USER_AUTHENTICATION_MQCSP, true);
            setUserCredentials(cf);
            if (CIPHER_SUITE != null && !CIPHER_SUITE.isEmpty()) {
                cf.setStringProperty(WMQConstants.WMQ_SSL_CIPHER_SUITE, CIPHER_SUITE);
            }
        } catch (JMSException jmsex) {
            recordFailure(jmsex);
        }
        return;
    }

    private static void recordFailure(Exception ex) {
        JmsExceptionHelper.recordFailure(logger,ex);
        return;
    }

    private static void setUserCredentials(JmsConnectionFactory cf) {
        try {
            if (accessToken != null) {
                cf.setStringProperty(WMQConstants.PASSWORD, accessToken);
            } else {
                if (null != APP_USER && !APP_USER.trim().isEmpty()) {
                    cf.setStringProperty(WMQConstants.USERID, APP_USER);
                    cf.setStringProperty(WMQConstants.PASSWORD, APP_PASSWORD);
                }
            }
        } catch (JMSException jmsex) {
            recordFailure(jmsex);
        }
      }

}
