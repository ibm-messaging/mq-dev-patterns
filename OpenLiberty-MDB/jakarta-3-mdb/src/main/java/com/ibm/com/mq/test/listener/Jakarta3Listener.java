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



