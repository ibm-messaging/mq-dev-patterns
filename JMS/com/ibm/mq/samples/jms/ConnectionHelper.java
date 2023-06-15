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

import javax.jms.Destination;
import javax.jms.JMSContext;
import javax.jms.JMSException;

import com.ibm.msg.client.jms.JmsConnectionFactory;
import com.ibm.msg.client.jms.JmsFactoryFactory;
import com.ibm.msg.client.wmq.WMQConstants;

import com.ibm.mq.jms.MQDestination;

import com.ibm.mq.samples.jms.SampleEnvSetter;

public class ConnectionHelper {

    private static final Level LOGLEVEL = Level.ALL;
    private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");
    public static final int USE_CONNECTION_STRING = -1;

    // Create variables for the connection to MQ
    private static String ConnectionString = null; //= "localhost(1414),localhost(1416)"
    private String HOST = null; // Host name or IP address
    private int PORT = 0; // Listener port for your queue manager
    private String CHANNEL = null; // Channel name
    private String QMGR = null; // Queue manager name
    private String APP_USER = null; // User name that application uses to connect to MQ
    private String APP_PASSWORD = null; // Password that the application uses to connect to MQ
    private String QUEUE_NAME = null; // Queue that the application uses to put and get messages to and from
    private String TOPIC_NAME = null; // Topic that the application publishes to
    private String CIPHER_SUITE = null;
    private static String CCDTURL;
    private static Boolean BINDINGS = false;

    JMSContext context;

    public ConnectionHelper (String id, int index) {

        //initialiseLogging();
        mqConnectionVariables(index);
        logger.info("Get application is starting");

        JmsConnectionFactory connectionFactory = createJMSConnectionFactory();
        setJMSProperties(connectionFactory, id, index);
        logger.info("created connection factory");

        context = connectionFactory.createContext();
        logger.info("context created");

    }

    public JMSContext getContext () {
        return context;
    }

    public void closeContext () {
        context.close();
        context = null;
    }

    public Destination getDestination () {
        return context.createQueue("queue:///" + QUEUE_NAME);

    }

    public Destination getTopicDestination () {
        return context.createTopic("topic://" + TOPIC_NAME);

    }

    public void setTargetClient(Destination destination) {
      try {
          MQDestination mqDestination = (MQDestination) destination;
          mqDestination.setTargetClient(WMQConstants.WMQ_CLIENT_NONJMS_MQ);
      } catch (JMSException jmsex) {
        logger.warning("Unable to set target destination to non JMS");
      }
    }

    private void mqConnectionVariables(int index) {
        SampleEnvSetter env = new SampleEnvSetter();

        if (USE_CONNECTION_STRING == index) {
          ConnectionString = env.getConnectionString();
          logger.info("Connecting to " + ConnectionString);
          index = 0;
        } else {
          HOST = env.getEnvValue("HOST", index);
          PORT = Integer.parseInt(env.getEnvValue("PORT", index));
          logger.info("Connection to " + HOST + "(" + PORT + ")");
        }
        CHANNEL = env.getEnvValue("CHANNEL", index);
        QMGR = env.getEnvValue("QMGR", index);
        APP_USER = env.getEnvValue("APP_USER", index);
        APP_PASSWORD = env.getEnvValue("APP_PASSWORD", index);
        QUEUE_NAME = env.getEnvValue("QUEUE_NAME", index);
        TOPIC_NAME = env.getEnvValue("TOPIC_NAME", index);
        CIPHER_SUITE = env.getEnvValue("CIPHER_SUITE", index);
        BINDINGS = env.getEnvBooleanValue("BINDINGS", index);

        CCDTURL = env.getCheckForCCDT();
    }

    private JmsConnectionFactory createJMSConnectionFactory() {
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

    private void setJMSProperties(JmsConnectionFactory cf, String id, int index) {
        try {
            if (null == CCDTURL) {
                if (USE_CONNECTION_STRING == index) {
                    cf.setStringProperty(WMQConstants.WMQ_CONNECTION_NAME_LIST, ConnectionString);
                } else {
                    cf.setStringProperty(WMQConstants.WMQ_HOST_NAME, HOST);
                    cf.setIntProperty(WMQConstants.WMQ_PORT, PORT);
                }

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
            cf.setStringProperty(WMQConstants.WMQ_APPLICATIONNAME, id);
            
            if (null != APP_USER && !APP_USER.trim().isEmpty()) {
                cf.setBooleanProperty(WMQConstants.USER_AUTHENTICATION_MQCSP, true);
                cf.setStringProperty(WMQConstants.USERID, APP_USER);
                cf.setStringProperty(WMQConstants.PASSWORD, APP_PASSWORD);
            }

            if (CIPHER_SUITE != null && !CIPHER_SUITE.isEmpty()) {
                cf.setStringProperty(WMQConstants.WMQ_SSL_CIPHER_SUITE, CIPHER_SUITE);
            }
        } catch (JMSException jmsex) {
            recordFailure(jmsex);
        }
        return;
    }

    public static void recordFailure(Exception ex) {
        if (ex != null) {
            if (ex instanceof JMSException) {
                processJMSException((JMSException) ex);
            } else {
                logger.warning(ex.getMessage());
            }
        }
        System.out.println("FAILURE");
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
}
