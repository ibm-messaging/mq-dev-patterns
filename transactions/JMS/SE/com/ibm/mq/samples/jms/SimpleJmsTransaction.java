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

package com.ibm.mq.samples.jms;

import java.util.Random;

import com.ibm.msg.client.jakarta.jms.JmsConnectionFactory;

import jakarta.jms.Destination;
import jakarta.jms.JMSContext;
import jakarta.jms.JMSException;
import jakarta.jms.JMSProducer;
import jakarta.jms.JMSRuntimeException;
import jakarta.jms.TextMessage;

/**
 * A minimal and simple application for Point-to-point messaging with a
 * transaction.
 *
 * Application assumes that the named queue is empty prior to a run.
 *
 * Notes:
 *
 * API type: Jakarta JMS API
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
public class SimpleJmsTransaction {

  // System exit status value (assume unset value to be 1)
  private static int status = 1;

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

    Random rand = new Random(); // instance of random class
    int upperbound = 999;

    // Defining a specific exception for when rollback is occuring
    class PutTransactionRollbackException extends Exception {

      private static final long serialVersionUID = 1L;

      public PutTransactionRollbackException(String s) {
        // Call constructor of parent Exception
        super(s);
      }
    }

    try {
      JmsConnectionFactory cf = Common.createCF();

      // Create JMS objects
      context = cf.createContext(JMSContext.SESSION_TRANSACTED);
      destination = context.createQueue("queue:///" + Common.QUEUE_NAME);

      int uniqueNumber = rand.nextInt(upperbound);
      System.out.println("Your number is: " + uniqueNumber);
      TextMessage message = context.createTextMessage("Your lucky number today is " + uniqueNumber);

      producer = context.createProducer();
      producer.send(destination, message);
      System.out.println("Sent message:\n" + message);

      try {
        // Sleep for 5 seconds before publishing the next event
        Thread.sleep(5000);
      } catch (InterruptedException e) {
        System.out.println("wait interrupt 5 sec");
      }
      if (uniqueNumber % 2 == 0) {
        throw new PutTransactionRollbackException("Lucky number was even, rolling back");
      }
      context.commit();

      recordSuccess();
    } catch (JMSException | JMSRuntimeException jmsex) {
      if (context != null) {
        context.rollback();
      }
      recordFailure(jmsex);
      System.out.println("JMSEX ");
      jmsex.printStackTrace();
    } catch (PutTransactionRollbackException ptsex) {
      context.rollback();
      recordFailure(ptsex);
      System.out.println("Rollback was successful, message was not put to queue");
      // This is an expected condition to reset status to OK
      status = 0;
    } catch (Exception ex) {
      System.out.println("EX ");
      ex.printStackTrace();
    }

    if (context != null) {
      try {
        context.stop();
        context.close();

      } catch (Exception e) {
        // ignore the exception
      }
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
    status = 0;

    if (ex != null) {
      if (ex instanceof JMSException) {
        processJMSException((JMSException) ex);
      } else {
        System.out.println(ex);
      }
    }
    System.out.println("FAILURE");
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
