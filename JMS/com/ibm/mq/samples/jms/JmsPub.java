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
import javax.jms.JMSProducer;
import javax.jms.JMSContext;
import javax.jms.Message;
import javax.jms.TextMessage;
import javax.jms.JMSRuntimeException;
import javax.jms.JMSException;

import com.ibm.msg.client.jms.JmsConnectionFactory;
import com.ibm.msg.client.jms.JmsFactoryFactory;
import com.ibm.msg.client.wmq.WMQConstants;

import com.ibm.mq.jms.MQDestination;

import com.ibm.mq.samples.jms.SampleEnvSetter;

public class JmsPub {
  private static final Level LOGLEVEL = Level.ALL;
  private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");

  // Create variables for the connection to MQ
  private static String ConnectionString; //= "localhost(1414),localhost(1416)"
  private static String CHANNEL; // Channel name
  private static String QMGR; // Queue manager name
  private static String APP_USER; // User name that application uses to connect to MQ
  private static String APP_PASSWORD; // Password that the application uses to connect to MQ
  private static String TOPIC_NAME; // Topic that the application publishes to
  private static String PUBLICATION_NAME = "JmsPub - SamplePublisher"; //
  private static String CIPHER_SUITE;
  private static String CCDTURL;
  private static Boolean BINDINGS = false;

  public static void main(String[] args) {
    initialiseLogging();
    mqConnectionVariables();
    logger.info("Put application is starting");

    JMSContext context = null;
    Destination destination = null;
    JMSProducer publisher = null;

    JmsConnectionFactory connectionFactory = createJMSConnectionFactory();
    logger.info("Application is starting.\n");

    setJMSProperties(connectionFactory);

    context = connectionFactory.createContext();

    // Set targetClient to be non JMS, so no JMS headers are transmitted.
    // Either this line can be used or ...
    //destination = context.createTopic("topic://" + TOPIC_NAME + "?targetClient=1");
    destination = context.createTopic("topic://" + TOPIC_NAME);

    // ... this one.
    setTargetClient(destination);

    publisher = context.createProducer();

    for (int i = 0; i < 20; i++) {
      logger.info("Publishing messages.\n");

      try {
        publisher.send(destination, "this is a message");
        logger.info("message was sent");
        Thread.sleep(2000);
      } catch (JMSRuntimeException jmsex) {

        jmsex.printStackTrace();
        try {
          Thread.sleep(1000);
        } catch (InterruptedException e) {
        }
      } catch (InterruptedException e) {
      }

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
    TOPIC_NAME = env.getEnvValue("TOPIC_NAME", index);
    CIPHER_SUITE = env.getEnvValue("CIPHER_SUITE", index);
    BINDINGS = env.getEnvBooleanValue("BINDINGS", index);

    CCDTURL = env.getCheckForCCDT();
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
      cf.setStringProperty(WMQConstants.WMQ_APPLICATIONNAME, "SimplePub (JMS)");
      if (null != APP_USER && !APP_USER.trim().isEmpty()) {
        cf.setBooleanProperty(WMQConstants.USER_AUTHENTICATION_MQCSP, true);
        cf.setStringProperty(WMQConstants.USERID, APP_USER);
        cf.setStringProperty(WMQConstants.PASSWORD, APP_PASSWORD);
      }
      cf.setStringProperty(WMQConstants.CLIENT_ID, PUBLICATION_NAME);
      if (CIPHER_SUITE != null && !CIPHER_SUITE.isEmpty()) {
        cf.setStringProperty(WMQConstants.WMQ_SSL_CIPHER_SUITE, CIPHER_SUITE);
      }
    } catch (JMSException jmsex) {
      recordFailure(jmsex);
    }
    return;
  }

  private static void setTargetClient(Destination destination) {
    try {
        MQDestination mqDestination = (MQDestination) destination;
        mqDestination.setTargetClient(WMQConstants.WMQ_CLIENT_NONJMS_MQ);
    } catch (JMSException jmsex) {
      logger.warning("Unable to set target destination to non JMS");
    }
  }

  private static void recordFailure(Exception ex) {
    if (ex != null) {
      if (ex instanceof JMSException) {
        processJMSException((JMSException) ex);
      } else {
        logger.info(ex.getMessage());
      }
    }
    logger.warning("FAILURE");
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
