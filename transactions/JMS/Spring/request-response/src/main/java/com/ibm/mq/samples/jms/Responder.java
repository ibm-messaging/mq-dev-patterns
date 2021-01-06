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

package com.ibm.mq.samples.jms;

import javax.jms.JMSException;
import javax.jms.Message;
import javax.jms.MessageProducer;
import javax.jms.Session;
import javax.jms.TextMessage;

import org.springframework.jms.annotation.JmsListener;
import org.springframework.jms.listener.SessionAwareMessageListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class Responder implements SessionAwareMessageListener {

  @JmsListener(destination = Requester.qName)
  @Transactional(rollbackFor = Exception.class)
  public void onMessage(Message msg, Session session) throws JMSException {
    String text;

    if (msg instanceof TextMessage) {
      text = ((TextMessage) msg).getText();
    }
    else {
      text = msg.toString();
    }

    System.out.println();
    System.out.println("========================================");

    System.out.println("Responder received message: " + text);
    System.out.println("           Redelivery flag: " + msg.getJMSRedelivered());
    System.out.println("========================================");

    final String msgID = msg.getJMSMessageID();

    MessageProducer replyDest = session.createProducer(msg.getJMSReplyTo());
    TextMessage replyMsg = session.createTextMessage("Replying to " + text);
    replyMsg.setJMSCorrelationID(msgID);
    replyDest.send(replyMsg);

    // We deliberately fail the first attempt at sending a reply. The message is
    // put back on its original queue and then redelivered. At that point, we
    // try to commit the reply.
    if (!msg.getJMSRedelivered()) {
      System.out.println("Doing a rollback");
      session.rollback();
      /*throw new JMSException("Instead of rollback"); - might prefer this to see what happens*/
    }
    else {
      System.out.println("Doing a commit");
      session.commit();
    }

  }

}
