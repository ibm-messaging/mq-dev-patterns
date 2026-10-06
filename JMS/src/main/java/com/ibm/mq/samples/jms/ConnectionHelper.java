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

import com.ibm.mq.jakarta.jms.MQDestination;
import com.ibm.msg.client.jakarta.jms.JmsConnectionFactory;
import com.ibm.msg.client.jakarta.jms.JmsFactoryFactory;
import com.ibm.msg.client.jakarta.wmq.WMQConstants;

import jakarta.jms.Destination;
import jakarta.jms.JMSContext;
import jakarta.jms.JMSException;

/*
 * This is the common class to create the connection to a queue manager. It uses
 * configuration read by the EnvSetter class and sets appropriate ConnectionFactory
 * properties.
 *
 * It also has methods to work with various types of destinations available from the
 * connection: the different queues and topics.
 */

public class ConnectionHelper {

  private static final Logger logger = LoggingHelper.getLogger(ConnectionHelper.class.getName());

  public static final int USE_CONNECTION_STRING = -1;

  // Create variables for the connection to MQ
  private String ConnectionString = null; //= "localhost(1414),localhost(1416)"
  private String HOST = null; // Host name or IP address
  private int PORT = 0; // Listener port for the queue manager
  private String CHANNEL = null; // Channel name
  private String QMGR = null; // Queue manager name
  private String APP_USER = null; // User name that application uses to connect to MQ
  private String APP_PASSWORD = null; // Password that the application uses to connect to MQ
  private String APP_NAME = null; // Application Name that the application uses
  private String QUEUE_NAME = null; // Queue that the application uses to put and get messages to and from
  private String MODEL_QUEUE_NAME = null; // For dynamic queues
  private String TOPIC_NAME = null; // Topic that the application publishes to
  private String BACKOUT_QUEUE_NAME = null; // Where to send messages if there's been a transaction backout
  private String CIPHER_SUITE = null;
  private String CCDTURL = null;
  private Boolean BINDINGS = false;

  private String accessToken = null;

  // The JMSContext object is the root of much of the work that's then going to be done
  private JMSContext context;

  public ConnectionHelper (String id, int index) {
    this(id, index, JMSContext.AUTO_ACKNOWLEDGE);
  }

  // Create the JMS Connection and Context.
  // The index allows us to select one of a list of endpoints from the JSON configuration if desired.
  // Note that this is not the same as the JSON CCDT file, which can instead be referred to by the
  // configuration.
  public ConnectionHelper (String id, int index, int transactional) {

    mqConnectionVariables(id, index);

    JmsConnectionFactory connectionFactory = createJMSConnectionFactory();
    setConnectionProperties(connectionFactory, id, index);
    logger.info("Created connection factory");

    context = connectionFactory.createContext(transactional);
    logger.info("Created context");

  }

  public JMSContext getContext () {
    return context;
  }

  public void closeContext () {
    if (context != null) {
      context.close();
    }
    context = null;
  }

  public Destination getQueue () {
    return context.createQueue("queue:///" + QUEUE_NAME);
  }

  public Destination getBackoutQueue () {
    if (null == BACKOUT_QUEUE_NAME || BACKOUT_QUEUE_NAME.isEmpty()) {
      logger.warning("No backout queue configured. This may cause a poison message situation");
      return null;
    }
    return context.createQueue("queue:///" + BACKOUT_QUEUE_NAME);
  }

  public Destination getTopic() {
    return context.createTopic("topic://" + TOPIC_NAME);
  }

  // By default, messages are sent with JMS properties, that will normally
  // appear to MQI applications as starting with an MQRFH2 structure. Setting
  // the target client to NONJMS means that those properties are not sent, making
  // it easier for non-JMS programs to process the message.
  public void setTargetClient(Destination destination) {
    try {
      // We have to use the implementation class, not the generic interface
      MQDestination mqDestination = (MQDestination) destination;
      mqDestination.setTargetClient(WMQConstants.WMQ_CLIENT_NONJMS_MQ);
    } catch (JMSException jmsex) {
      logger.warning("Unable to set target destination to non-JMS");
    }
  }

  // Get the configuration options we need
  private void mqConnectionVariables(String default_app_name, int index) {
    EnvSetter env = new EnvSetter();

    CCDTURL = env.getCheckForCCDT();

    // If the CCDT is in use then a connection string will
    // not be needed.
    if (null == CCDTURL) {
      if (USE_CONNECTION_STRING == index) {
        ConnectionString = env.getConnectionString();
        logger.log(Level.INFO, "Connecting to {0}", ConnectionString);
        index = 0;
      } else {
        HOST = env.getEnvValue("HOST", index);
        PORT = env.getPortEnvValue("PORT", index);
        logger.log(Level.INFO, "Connecting to {0}", HOST + "(" + PORT + ")");
      }
    } else if (USE_CONNECTION_STRING == index) {
      index = 0;
    }

    CHANNEL = env.getEnvValue("CHANNEL", index);
    QMGR = env.getEnvValue("QMGR", index);
    APP_USER = env.getEnvValue("APP_USER", index);
    APP_PASSWORD = env.getEnvValue("APP_PASSWORD", index);
    APP_NAME = env.getEnvValueOrDefault("APP_NAME", default_app_name, index);
    QUEUE_NAME = env.getEnvValue("QUEUE_NAME", index);
    TOPIC_NAME = env.getEnvValue("TOPIC_NAME", index);
    CIPHER_SUITE = env.getEnvValue("CIPHER_SUITE", index);
    BINDINGS = env.getEnvBooleanValue("BINDINGS", index);
    MODEL_QUEUE_NAME = env.getEnvValue("MODEL_QUEUE_NAME", index);
    BACKOUT_QUEUE_NAME = env.getEnvValue("BACKOUT_QUEUE", index);

    JwtHelper jh = new JwtHelper(env);
    if (jh.isJwtEnabled()) {
      accessToken = jh.obtainToken();
    } else {
      logger.info("No JWT configuration found. Will not be using JWT for authentication.");
    }
  }

  // Create the JMS Connection Factory
  private JmsConnectionFactory createJMSConnectionFactory() {
    JmsFactoryFactory ff;
    JmsConnectionFactory cf;
    try {
      ff = JmsFactoryFactory.getInstance(WMQConstants.JAKARTA_WMQ_PROVIDER);
      cf = ff.createConnectionFactory();
    } catch (JMSException jmsex) {
      JmsExceptionHelper.recordFailure(logger, jmsex);
      cf = null;
    }
    return cf;
  }


  // Set the specific properties needed on the CF to enable the connection to be
  // made. This includes any authentication options - userid/password or token
  private void setConnectionProperties(JmsConnectionFactory cf, String id, int index) {
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
        logger.log(Level.INFO, "Will be using CCDT file: {0}", CCDTURL);
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
      cf.setStringProperty(WMQConstants.WMQ_APPLICATIONNAME, id);
      cf.setStringProperty(WMQConstants.WMQ_TEMPORARY_MODEL, MODEL_QUEUE_NAME);

      if (accessToken != null) {
        cf.setStringProperty(WMQConstants.PASSWORD, accessToken);
      } else if (null != APP_USER && !APP_USER.trim().isEmpty()) {
        cf.setBooleanProperty(WMQConstants.USER_AUTHENTICATION_MQCSP, true);
        cf.setStringProperty(WMQConstants.USERID, APP_USER);
        cf.setStringProperty(WMQConstants.PASSWORD, APP_PASSWORD);
      }

      if (CIPHER_SUITE != null && !CIPHER_SUITE.isEmpty()) {
        cf.setStringProperty(WMQConstants.WMQ_SSL_CIPHER_SUITE, CIPHER_SUITE);
      }
    } catch (JMSException jmsex) {
      JmsExceptionHelper.recordFailure(logger, jmsex);
    }
    return;
  }
}
