package com.ibm.com.mq.test.listener;

import jakarta.ejb.MessageDriven;
import jakarta.jms.JMSException;
import jakarta.jms.Message;
import jakarta.jms.MessageListener;

@MessageDriven(name = "Jakarta3ListenerMDB")
public class Jakarta3Listener implements MessageListener {

  public void onMessage(Message message) {
    try {
      //Sample assumes JMS Text Message
      System.out.println("Jakarta 3.0 Messaging MDB received message: " + message.getBody(String.class));
    } catch (JMSException e) {
      //Avoid rollback/retry cycle in sample, give up!
      throw new RuntimeException(e);
    }
  }

}



