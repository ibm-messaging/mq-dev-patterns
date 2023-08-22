/*
 * (c) Copyright IBM Corporation 2020, 2023
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

import com.ibm.msg.client.jms.JmsConnectionFactory;
import com.ibm.msg.client.jms.JmsFactoryFactory;
import com.ibm.msg.client.wmq.WMQConstants;
import java.util.Random;
import javax.jms.Destination;
import javax.jms.JMSContext;
import javax.jms.JMSException;
import javax.jms.JMSProducer;
import javax.jms.TextMessage;

/**
 * A minimal and simple application for Point-to-point messaging with a transaction.
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
public class simpleJmsTransaction {

  // System exit status value (assume unset value to be 1)
  private static int status = 1;

  // Create variables for the connection to MQ
  private static final String HOST = "localhost"; // Host name or IP address
  private static final int PORT = 1414; // Listener port for your queue manager
  private static final String CHANNEL = "DEV.APP.SVRCONN"; // Channel name
  private static final String QMGR = "QM1"; // Queue manager name
  private static final String APP_USER = "app"; // User name that application uses to connect to MQ
  private static final String APP_PASSWORD = "passw0rd"; // Password that the application uses to connect to MQ
  private static final String QUEUE_NAME = "DEV.QUEUE.1"; // Queue that the application uses to put and get messages to and from

  /**
   * Main method
   *
   * @param args
   */
  public static void main(String[] args) {
    // Variables
    JMSContext context = null;
    Destination destination = null;
    JMSProducer producer = null;

    Random rand = new Random(); //instance of random class
    int upperbound = 999;

    // Defining a specific exception for when rollback is occuring
    class PutTransactionRollbackException extends Exception {

      public PutTransactionRollbackException(String s) {
        // Call constructor of parent Exception
        super(s);
      }
    }

    try {
      // Create a connection factory
      JmsFactoryFactory ff = JmsFactoryFactory.getInstance(
        WMQConstants.WMQ_PROVIDER
      );
      JmsConnectionFactory cf = ff.createConnectionFactory();

      // Set the properties
      cf.setStringProperty(WMQConstants.WMQ_HOST_NAME, HOST);
      cf.setIntProperty(WMQConstants.WMQ_PORT, PORT);
      cf.setStringProperty(WMQConstants.WMQ_CHANNEL, CHANNEL);
      cf.setIntProperty(
        WMQConstants.WMQ_CONNECTION_MODE,
        WMQConstants.WMQ_CM_CLIENT
      );
      cf.setStringProperty(WMQConstants.WMQ_QUEUE_MANAGER, QMGR);
      cf.setStringProperty(
        WMQConstants.WMQ_APPLICATIONNAME,
        "simpleJmsTransaction (JMS)"
      );
      cf.setBooleanProperty(WMQConstants.USER_AUTHENTICATION_MQCSP, true);
      cf.setStringProperty(WMQConstants.USERID, APP_USER);
      cf.setStringProperty(WMQConstants.PASSWORD, APP_PASSWORD);

      // Create JMS objects

      int uniqueNumber = rand.nextInt(upperbound);

      context = cf.createContext(JMSContext.SESSION_TRANSACTED);
      destination = context.createQueue("queue:///" + QUEUE_NAME);

      TextMessage message = context.createTextMessage(
        "Your lucky number today is " + uniqueNumber
      );

      producer = context.createProducer();

      producer.send(destination, message);
      System.out.println("Sent message:\n" + message);

      try {
        // Sleep for 15 seconds before publishing the next event
        Thread.sleep(15000);
      } catch (InterruptedException e) {
        System.out.println("wait interrupt 15 sec");
      }
      if (uniqueNumber % 2 == 0) {
        throw new PutTransactionRollbackException(
          "Lucky number was even, rolling back"
        );
      }
      context.commit();

      recordSuccess();
    } catch (JMSException jmsex) {
      context.rollback();
      recordFailure(jmsex);
      System.out.println("JMSEX ");
      jmsex.printStackTrace();
    } catch (PutTransactionRollbackException ptsex) {
      context.rollback();
      recordFailure(ptsex);
      System.out.println(
        "Rollback was successful, message was not put to queue"
      );
    } catch (Exception ex) {
      System.out.println("EX ");
      ex.printStackTrace();
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
