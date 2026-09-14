/*
 * (c) Copyright IBM Corporation 2020, 2026
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

/* A package shared by all the samples in this directory.
 * It creates the ConnectionFactory based on configuration elements. Defaults
 * are coded in here, but can be overridden by environment variables.
 */

package com.ibm.mq.samples.jms;

import com.ibm.msg.client.jakarta.jms.JmsConnectionFactory;
import com.ibm.msg.client.jakarta.jms.JmsFactoryFactory;
import com.ibm.msg.client.jakarta.wmq.WMQConstants;

import jakarta.jms.JMSException;

public class Common {

  // Create variables for the connection to MQ
  private static final String DEFAULT_HOST = "localhost"; // Host name or IP address
  private static final int DEFAULT_PORT = 1414; // Listener port for your queue manager
  private static final String DEFAULT_CHANNEL = "DEV.APP.SVRCONN"; // Channel name
  private static final String DEFAULT_QMGR = "QM1"; // Queue manager name
  private static final String DEFAULT_APP_USER = "app"; // User name that application uses to connect to MQ
  private static final String DEFAULT_APP_PASSWORD = "passw0rd"; // Password the app uses to connect to MQ
  private static final String DEFAULT_QUEUE_NAME = "DEV.QUEUE.1"; // Queue the app uses to put and get messages
  private static final String DEFAULT_MODEL_QUEUE_NAME = "DEV.APP.MODEL.QUEUE"; // For dynamic ReplyTo queue name

  private static String HOST;
  private static int PORT;
  private static String CHANNEL;
  private static String QMGR;
  private static String APP_USER;
  private static String APP_PASSWORD;
  static String QUEUE_NAME; // Queue names are used directly by the main apps so not private for simplicity.
  static String MODEL_QUEUE_NAME;

  // Read an environment variable and return its value, or the default
  private static String getEnvString(String ev, String def) {
    String s = System.getenv(ev);
    if (s != null) {
      return s;
    }
    else {
      return def;
    }
  }

  // Read an enviroment variable and return the integer value, or the default
  private static int getEnvInt(String ev, int def) {
    String s = System.getenv(ev);
    if (s != null) {
      return Integer.valueOf(s);
    }
    else {
      return def;
    }
  }

  // Get the configuration parameters from the environment. If not set, use the defaults.
  private static void getEnvOverrides() {
    HOST = getEnvString("HOST", DEFAULT_HOST);
    PORT = getEnvInt("PORT", DEFAULT_PORT);
    CHANNEL = getEnvString("CHANNEL", DEFAULT_CHANNEL);
    QMGR = getEnvString("QMGR", DEFAULT_QMGR);
    APP_USER = getEnvString("APP_USER", DEFAULT_APP_USER);
    APP_PASSWORD = getEnvString("APP_PASSWORD", DEFAULT_APP_PASSWORD);
    QUEUE_NAME = getEnvString("QUEUE_NAME", DEFAULT_QUEUE_NAME);
    MODEL_QUEUE_NAME = getEnvString("MODEL_QUEUE_NAME", DEFAULT_MODEL_QUEUE_NAME);
  }

  static JmsConnectionFactory createCF() throws JMSException {
    // Get any config overrides from the environment
    getEnvOverrides();

    // Create a connection factory
    JmsFactoryFactory ff = JmsFactoryFactory.getInstance(WMQConstants.JAKARTA_WMQ_PROVIDER);
    JmsConnectionFactory cf = ff.createConnectionFactory();

    // Set the properties
    cf.setStringProperty(WMQConstants.WMQ_HOST_NAME, HOST);
    cf.setIntProperty(WMQConstants.WMQ_PORT, PORT);
    cf.setStringProperty(WMQConstants.WMQ_CHANNEL, CHANNEL);
    cf.setIntProperty(WMQConstants.WMQ_CONNECTION_MODE, WMQConstants.WMQ_CM_CLIENT);
    cf.setStringProperty(WMQConstants.WMQ_QUEUE_MANAGER, QMGR);
    cf.setStringProperty(WMQConstants.WMQ_APPLICATIONNAME, "simpleJmsTransaction (JMS)");
    cf.setBooleanProperty(WMQConstants.USER_AUTHENTICATION_MQCSP, true);
    cf.setStringProperty(WMQConstants.USERID, APP_USER);
    cf.setStringProperty(WMQConstants.PASSWORD, APP_PASSWORD);

    // Used for the ReplyQ setup in the requester app
    cf.setStringProperty(WMQConstants.WMQ_TEMPORARY_MODEL, Common.MODEL_QUEUE_NAME);

    return cf;
  }
}
