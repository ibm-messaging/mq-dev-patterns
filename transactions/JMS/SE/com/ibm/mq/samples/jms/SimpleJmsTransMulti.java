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
 * A minimal and simple application for Point-to-point messaging.
 *
 * Application makes use of fixed literals, any customisations will require
 * re-compilation of this source file. Application assumes that the named queue
 * is empty prior to a run.
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
public class SimpleJmsTransMulti {

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
    boolean ROLLBACK = false;

    // Defining a specific exception for when rollback is occuring
    class PutTransactionRollbackException extends Exception {

      public PutTransactionRollbackException(String s) {
        // Call constructor of parent Exception
        super(s);
      }
    }

    try {
      // Create a connection factory
      JmsConnectionFactory cf = Common.createCF();

      // Create JMS objects
      context = cf.createContext(JMSContext.SESSION_TRANSACTED);
      destination = context.createQueue("queue:///" + Common.QUEUE_NAME);

      int uniqueNumber = rand.nextInt(upperbound);

      // if unique number is EVEN an exception will be thrown before all messages can be sent
      // causing a rollback so no messages will be sent
      if (uniqueNumber % 2 == 0) {
        ROLLBACK = true;
        System.out.println("RANDOM NUMBER EVEN, DEMONSTRATING ROLLBACK");
      } else {
        System.out.println("RANDOM NUMBER ODD, DEMONSTRATING COMMIT");
      }

      TextMessage message1 = context.createTextMessage("Your lucky number today is 1");
      TextMessage message2 = context.createTextMessage("Your lucky number today is 2");
      TextMessage message3 = context.createTextMessage("Your lucky number today is 3");

      producer = context.createProducer();

      // send message 1
      producer.send(destination, message1);
      System.out.printf("Message 1 sent but not committed. Messages on %s will increase by 1 but new message won't be visible.\n",Common.QUEUE_NAME);
      Pause();

      // send message 2
      producer.send(destination, message2);
      System.out.printf("Message 2 sent but not committed. Messages on %s will increase by 1 but new message won't be visible.\n",Common.QUEUE_NAME);
      Pause();

      // throw an exception here to cause a rollback resulting in none of the messages being committed
      if (ROLLBACK) {
        throw new PutTransactionRollbackException("Triggering a ROLLBACK so no messages will be committed");
      }

      // send message 3
      producer.send(destination, message3);
      System.out.printf("Message 3 sent but not committed. Messages on %s will increase by 1 but new message won't be visible.\n",Common.QUEUE_NAME);
      Pause();

      // Commit all messages
      context.commit();

      // Print contents of all messages
      System.out.println("Sent message:" + message1 + "\n");
      System.out.println("Sent message:" + message2 + "\n");
      System.out.println("Sent message:" + message3 + "\n");
      System.out.printf("All messages have now been COMMITTED to %s and should be visible there.\n",Common.QUEUE_NAME);
      recordSuccess();
    }

    catch (JMSException | JMSRuntimeException jmsex) {
      if (context != null) {
        context.rollback();
      }
      recordFailure(jmsex);
      System.out.println("JMSEX ");
      jmsex.printStackTrace();
    } catch (PutTransactionRollbackException ptsex) {
      context.rollback();
      recordFailure(ptsex);
      System.out.printf("ROLLBACK was successful, number of messages on %s will go down by 2\n",Common.QUEUE_NAME);
      // This is an expected exception, so reset the status to OK
      status = 0;
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
    System.out.printf("COMMIT was successful, all 3 messages will be visible on %s\n",Common.QUEUE_NAME);
    status = 0;
    return;
  }

  /**
   * 5 second pause between sending messages to allow users to refresh MQ console
   * and see the results.
   */
  private static void Pause() {
    try {
      // Sleep for 5 seconds before publishing the next event
      Thread.sleep(5000);
    } catch (InterruptedException e) {
      System.out.println("Pause to check MQ console");
    }
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
