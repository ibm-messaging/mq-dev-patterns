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

// An example of using the Spring Boot JmsTemplate in a request/reply pattern.
// The main application thread sends a message and then waits for a reply.
// Meanwhile, a JMS Listener is waiting for an input message to which it replies as
// part of the same transaction.
//
// The jmsTemplate.sendAndReceive method creates a temporary queue to which the reply will be
// sent. It can make use of the 'ibm.mq.tempModel' configuration property to select which
// Model queue to use to underpin that TDQ. If you are going to do many request/reply operations,
// it will be more efficient to create the reply queue once and use a separate receive() call.

package com.ibm.mq.samples.jms;

import java.util.Date;

import javax.jms.ConnectionFactory;
import javax.jms.JMSException;
import javax.jms.Message;
import javax.jms.Session;
import javax.jms.TextMessage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.jms.annotation.EnableJms;
import org.springframework.jms.connection.JmsTransactionManager;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.jms.core.MessageCreator;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableJms
@EnableTransactionManagement
public class Requester {
  // Create a transaction manager object that will be used to control commit/rollback of operations in the listener.
  static JmsTransactionManager tm = new JmsTransactionManager();
  static final String qName = "DEV.QUEUE.1"; // A queue from the default MQ Developer container config

  static String correlID = null;
  static TextMessage message;

  // Construct a Transaction Manager that will control local transactions.
  @Bean
  public JmsTransactionManager transactionManager(ConnectionFactory connectionFactory) {
    JmsTransactionManager transactionManager = new JmsTransactionManager(connectionFactory);
    return transactionManager;
  }

  public static void main(String[] args) throws JMSException {
    // Launch the application
    ConfigurableApplicationContext context = SpringApplication.run(Requester.class, args);

    printStarted();

    // Create the JMS Template object to control connections and sessions.
    JmsTemplate jmsTemplate = context.getBean(JmsTemplate.class);
    jmsTemplate.setReceiveTimeout(5 * 1000); // How long to wait for a reply - milliseconds

    // Create a single message with a timestamp
    String payload = "Hello from IBM MQ at " + new Date();

    // Send the message and wait for a reply for up to the specified timeout
    Message replyMsg = jmsTemplate.sendAndReceive(qName, new MessageCreator() {
      @Override
      public Message createMessage(Session session) throws JMSException {
        message = session.createTextMessage(payload);
        System.out.println("Sending message: " + message.getText());
        return message;
      }
    });


    if (replyMsg != null) {
      if (replyMsg instanceof TextMessage) {
        System.out.println("Reply message is: " + ((TextMessage) replyMsg).getText());
      }
      else {
        System.out.println("Reply message is: " + replyMsg.toString());
      }
    }
    else {
      System.out.println("No reply received");
    }

    System.out.println("Done.");
    System.exit(0);
  }

  static void printStarted() {
    System.out.println();
    System.out.println("========================================");
    System.out.println("MQ JMS Request/Reply Sample started.");
    System.out.println("========================================");
  }
}
