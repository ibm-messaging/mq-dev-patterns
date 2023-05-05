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

import java.util.logging.*;

import javax.jms.Destination;
import javax.jms.JMSConsumer;
import javax.jms.JMSContext;
import javax.jms.Message;
import javax.jms.JMSRuntimeException;

import com.ibm.mq.samples.jms.ConnectionHelper;
import com.ibm.mq.samples.jms.LoggingHelper;
import com.ibm.mq.samples.jms.ConsumerHelper;


public class BasicConsumer {
    private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");

    public static final String CONSUMER_SUB = "topic";
    public static final String CONSUMER_GET = "queue";

    private JMSContext context = null;
    private Destination destination = null;
    private JMSConsumer consumer = null;
    private ConnectionHelper ch = null;

    public BasicConsumer(String type, int index) {
        String id = null;

        switch(type){
            case CONSUMER_SUB :
                id = "Basic sub";
                break;
            case CONSUMER_GET :
                id = "Basic Get";
                break;
        }

        LoggingHelper.init(logger);
        logger.info("Sub application is starting");

        ch = new ConnectionHelper(id, index);
        logger.info("created connection factory");

        context = ch.getContext();
        logger.info("context created");

        switch(type){
            case CONSUMER_SUB :
                destination = ch.getTopicDestination();
                break;
            case CONSUMER_GET :
                destination = ch.getDestination();
                break;
        }

        logger.info("destination created");
    }

    public void receive(int requestTimeout) {
      boolean continueProcessing = true;

      consumer = context.createConsumer(destination);
      logger.info("consumer created");

      while (continueProcessing) {
          try {
              Message receivedMessage = consumer.receive(requestTimeout);
              if (receivedMessage == null) {
                  logger.info("No message received from this endpoint");
                   continueProcessing = false;
              } else {
                new ConsumerHelper(receivedMessage);
              }
          } catch (JMSRuntimeException jmsex) {
              jmsex.printStackTrace();
              try {
                  Thread.sleep(1000);
              } catch (InterruptedException e) {
              }
          }
       }
    }

    public void close() {
        consumer.close();
        ch.closeContext();
        consumer = null;
        ch = null;
    }
}
