/*
 * Copyright © 2017, 2020 IBM Corp. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

// An example of using the Spring Boot JmsTemplate in conjunction with local transactions
//
// This program connects to a queue manager, puts a message and then tries to move the message
// from one queue to another, but choosing to fail that movement through a rollback of the
// transaction. Despite using a Spring TransactionManager object, there is no distributed (XA or
// two-phase) transaction created.
//
// An equivalent MQI program would have this logic:
//   MQPUT(q1) with SYNCPOINT
//   MQCMIT
//   MQGET(q1) with SYNCPOINT
//   MQPUT(q2) with SYNCPOINT
//   MQBACK

package com.ibm.mq.samples.jms;

import java.util.Date;

import javax.jms.Message;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jms.annotation.EnableJms;
import org.springframework.jms.connection.JmsTransactionManager;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableJms
@EnableTransactionManagement
public class Application {

  static final String qName1 = "DEV.QUEUE.1"; // A queue from the default MQ Developer container config
  static final String qName2 = "DEV.QUEUE.2"; // Another queue from the default MQ Developer container config

  public static void main(String[] args) {

    // Launch the application
    ConfigurableApplicationContext context = SpringApplication.run(Application.class, args);

    // Create a transaction manager object that will be used to control commit/rollback of operations.
    JmsTransactionManager tm = new JmsTransactionManager();

    printStarted();

    // Create the JMS Template object to control connections and sessions.
    JmsTemplate jmsTemplate = context.getBean(JmsTemplate.class);

    // Associate the connection factory with the transaction manager
    tm.setConnectionFactory(jmsTemplate.getConnectionFactory());

    // This starts a new transaction scope. "null" can be used to get a default transaction model
    TransactionStatus status = tm.getTransaction(null);

    // Create a single message with a timestamp
    String outMsg = "Hello from IBM MQ at " + new Date();

    // The default SimpleMessageConverter class will be called and turn a String
    // into a JMS TextMessage which we send to qName1. This operation will be made
    // part of the transaction that we initiated.
    jmsTemplate.convertAndSend(qName1, outMsg);

    // Commit the transaction so the message is now visible
    tm.commit(status);

    // But now we're going to start a new transaction to hold multiple operations.
    status = tm.getTransaction(null);
    // Read it from the queue where we just put it, and then send it straight on to
    // a different queue
    Message inMsg = jmsTemplate.receive(qName1);
    jmsTemplate.convertAndSend(qName2, inMsg);
    // This time we decide to rollback the transaction so the receive() and send() are
    // reverted. We end up with the message still on qName1.
    tm.rollback(status);

    System.out.println("Done.");
  }

  static void printStarted() {
    System.out.println();
    System.out.println("========================================");
    System.out.println("MQ JMS Transaction Sample started.");
    System.out.println("========================================");
  }
}
