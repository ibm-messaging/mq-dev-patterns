/*
 * (c) Copyright IBM Corporation 2019, 2026
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

/*
 * This class is the common component underlying PUBLISH and PUT operations.
 *
 */

package com.ibm.mq.samples.jms;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.logging.Level;
import java.util.logging.Logger;

import jakarta.jms.Destination;
import jakarta.jms.JMSContext;
import jakarta.jms.JMSProducer;
import jakarta.jms.JMSRuntimeException;

public class BasicProducer {
  private static final Logger logger = LoggingHelper.getLogger(BasicProducer.class.getName());

  public static final String PRODUCER_PUT = "queue";
  public static final String PRODUCER_PUB = "topic";

  private JMSContext context = null;
  private Destination destination = null;
  private JMSProducer producer = null;
  private ConnectionHelper ch = null;

  /*
   * The constructor creates a JMS Producer that can then be used to send messages.
   */
  public BasicProducer(String type) {
    String id = null;

    switch(type){
    case PRODUCER_PUT :
      id = "Basic put";
      break;
    case PRODUCER_PUB :
      id = "Basic pub";
      break;
    }

    logger.log(Level.INFO, "Application \"{0}\" is starting ",id);

    ch = new ConnectionHelper(id, ConnectionHelper.USE_CONNECTION_STRING);
    context = ch.getContext();

    switch(type){
    case PRODUCER_PUB:
      destination = ch.getTopic();
      break;
    case PRODUCER_PUT:
      destination = ch.getQueue();
      break;
    }

    // Set so no JMS headers are sent.
    ch.setTargetClient(destination);

    logger.log(Level.INFO, "Created destination: {0}",destination);

    producer = context.createProducer();
  }

  /*
   * Send a number of identical messages with a preceding timestamp
   */
  public void send(String message, int n_messages) {
    for (int i = 0; i < n_messages; i++) {
      logger.info("Sending messages.");

      try {
        String timestamp = new SimpleDateFormat("HH:mm:ss : ").format(new Date());
        producer.send(destination, timestamp + message);
        logger.info("Message was sent");
        Thread.sleep(2000);
      } catch (JMSRuntimeException jmsex) {
        JmsExceptionHelper.recordFailure(logger,jmsex);
        try {
          Thread.sleep(1000);
        } catch (InterruptedException e) {
        }
      } catch (InterruptedException e) {
      }
    }
  }

  public void close() {
    ch.closeContext();
    ch = null;
  }
}
