/*
 * (c) Copyright IBM Corporation 2019
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

import java.util.logging.Level;
import java.util.logging.Logger;

import jakarta.jms.JMSException;
import jakarta.jms.Message;
import jakarta.jms.TextMessage;

public class ConsumerHelper {
  private static final Logger logger = LoggingHelper.getLogger(ConsumerHelper.class.getName());

  public ConsumerHelper(Message receivedMessage){
    if (receivedMessage instanceof TextMessage) {
      TextMessage textMessage = (TextMessage) receivedMessage;
      try {
        logger.log(Level.INFO, "Received message: {0}", textMessage.getText());
      } catch (JMSException jmsex) {
        JmsExceptionHelper.recordFailure(logger, jmsex);
      }
    } else if (receivedMessage instanceof Message) {
      logger.info("Received message was not of type TextMessage");
    } else {
      logger.info("Received object was not a JMS Message");
    }
  }
}