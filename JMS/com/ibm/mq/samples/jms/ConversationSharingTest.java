/*
* (c) Copyright IBM Corporation 2024
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

import javax.jms.JMSContext;
import javax.jms.JMSException;

// Use these imports for building with Jakarta Messaging
// import jakarta.jms.JMSContext;
// import jakarta.jms.JMSException;

import com.ibm.msg.client.jms.JmsConnectionFactory;
import com.ibm.msg.client.jms.JmsFactoryFactory;
import com.ibm.msg.client.wmq.WMQConstants;

public class ConversationSharingTest {

  // System exit status value (assume unset value to be 1)
  private static int status = 1;

  // Create variables for the connection to MQ
  private static final String HOST = "localhost"; // Host name or IP address
  private static final int PORT = 1414; // Listener port for your queue manager
  private static final String CHANNEL = "JMS.SVRCONN"; // Channel name
  private static final String QMGR = "QM1"; // Queue manager name
  private static final String APP_USER = ""; // User name that application uses to connect to MQ
  private static final String APP_PASSWORD = ""; // Password that the application uses to connect to MQ

  /**
   * Main method
   *
   * @param args
   */
  public static void main(String[] args) {

    // Variables
    JMSContext context1 = null;
    JMSContext context2 = null;

    try {
      // Create a connection factory
      JmsFactoryFactory ff = JmsFactoryFactory.getInstance(WMQConstants.WMQ_PROVIDER);
      JmsConnectionFactory cf = ff.createConnectionFactory();

      // Set the properties
      cf.setStringProperty(WMQConstants.WMQ_HOST_NAME, HOST);
      cf.setIntProperty(WMQConstants.WMQ_PORT, PORT);
      cf.setStringProperty(WMQConstants.WMQ_CHANNEL, CHANNEL);
      cf.setIntProperty(WMQConstants.WMQ_CONNECTION_MODE, WMQConstants.WMQ_CM_CLIENT);
      cf.setStringProperty(WMQConstants.WMQ_QUEUE_MANAGER, QMGR);
      cf.setStringProperty(WMQConstants.WMQ_APPLICATIONNAME, "Conversation Sharing Test");
      cf.setBooleanProperty(WMQConstants.USER_AUTHENTICATION_MQCSP, true);
      cf.setStringProperty(WMQConstants.USERID, APP_USER);
      cf.setStringProperty(WMQConstants.PASSWORD, APP_PASSWORD);

      // Create JMS objects
	  
	  // Initially, create a JMSContext and then sleep for 60 seconds.
      System.out.println("Creating a JMSContext for queue manager " + QMGR);
      context1 = cf.createContext();
      System.out.println("JMSContext created. Sleeping for 60 seconds");
      Thread.sleep(60000);
	  
	  // Now, create a second JMSContext from the first one, and sleep for
	  // another 60 seconds.
      System.out.println("Creating a new JMSContext from the first JMSContext"); 
      context2 = context1.createContext(JMSContext.AUTO_ACKNOWLEDGE);
      System.out.println("Second JMSContext created. Sleeping for 60 seconds");
      Thread.sleep(60000);
	  
	  // Next, close the second JMSContext and sleep for 60 seconds.
      System.out.println("Closing the second JMSContext");
      context2.close();
      System.out.println("JMSContext closed. Sleeping for 60 seconds");
      Thread.sleep(60000);
	  
	  // Finally, close the first JMSContext and sleep for 60 seconds.
      System.out.println("Closing the first JMSContext");
      context1.close();
      System.out.println("JMSContext closed. Sleeping for 60 seconds");
      Thread.sleep(60000);
	  
      System.out.println("Exiting");
      recordSuccess();
    } catch (JMSException jmsex) {
      recordFailure(jmsex);
    } catch (InterruptedException interruptedException) {
      recordFailure(interruptedException);
    }

    System.exit(status);

  } // end main()

  /**
   * Record this run as successful.
   */
  private static void recordSuccess() {
    System.out.println("SUCCESS");
    status = 0;
    return;
  }

  /**
   * Record this run as failure.
   *
   * @param ex
   */
  private static void recordFailure(Exception ex) {
    if (ex != null) {
      if (ex instanceof JMSException) {
        processJMSException((JMSException) ex);
      } else {
        System.out.println(ex);
      }
    }
    System.out.println("FAILURE");
    status = -1;
    return;
  }

  /**
   * Process a JMSException and any associated inner exceptions.
   *
   * @param jmsex
   */
  private static void processJMSException(JMSException jmsex) {
    System.out.println(jmsex);
    Throwable innerException = jmsex.getLinkedException();
    if (innerException != null) {
      System.out.println("Inner exception(s):");
    }
    while (innerException != null) {
      System.out.println(innerException);
      innerException = innerException.getCause();
    }
    return;
  }

}
