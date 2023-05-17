/*
* (c) Copyright IBM Corporation 2023
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


