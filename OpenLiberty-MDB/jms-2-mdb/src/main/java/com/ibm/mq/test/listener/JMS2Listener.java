package com.ibm.com.mq.test.listener;

import javax.ejb.MessageDriven;
import javax.jms.JMSException;
import javax.jms.Message;
import javax.jms.MessageListener;

@MessageDriven(name = "JMS2ListenerMDB")
public class JMS2Listener implements MessageListener {

  public void onMessage(Message message) {
    try {
      //Sample assumes JMS Text Message
      System.out.println("JMS 2.0 Messaging MDB received message: " + message.getBody(String.class));
    } catch (JMSException e) {
      //Avoid rollback/retry cycle in sample, give up!
      throw new RuntimeException(e);
    }
  }

}


