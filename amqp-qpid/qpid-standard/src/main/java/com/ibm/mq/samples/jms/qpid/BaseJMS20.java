/*
* (c) Copyright IBM Corporation 2020
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

package com.ibm.mq.samples.jms.qpid;

import java.util.logging.*;

import javax.naming.NamingException;
import javax.naming.InitialContext;

import javax.jms.ConnectionFactory;
import javax.jms.JMSContext;
import javax.jms.Queue;
import javax.jms.Topic;


public class BaseJMS20 {
  protected static Logger logger = null;
  protected String destinationType = null;

  protected InitialContext ic = null;

  protected ConnectionFactory factory = null;
  protected Queue q = null;
  protected Queue rq = null;
  protected Topic t = null;

  protected JMSContext context = null;
  protected Options options = null;

  private Boolean quarkusMode = false;

  public BaseJMS20 (Options o) {
    logger = o.logger();
    destinationType = o.destinationType();
    options = o;

    try {
      logger.info("Obtaining initial context");
      ic = new InitialContext();

      logger.info("Obtaining connection factory");
      factory = (ConnectionFactory) ic.lookup("myFactoryLookup");

      logger.info("Getting Queue");
      q = loadQueue("myQueueLookup");

      logger.info("Getting ReplyQueue");
      rq = loadQueue("myReplyQueueLookup");

      logger.info("Getting Topic");
      t = loadTopic("myTopicLookup");

    } catch (NamingException ex) {
      ex.printStackTrace();
    }
  }

  public BaseJMS20 (Options o, ConnectionFactory cf) {
    logger = o.logger();
    destinationType = o.destinationType();
    options = o;

    factory = cf;
    quarkusMode = true;
  }


  private Queue loadQueue(String lookup) {
    try {
      return (Queue) ic.lookup(lookup);
    } catch (NamingException ex) {
      logger.warning("Lookup for Queue " + lookup + " not found");
      return null;
    }
  }

  private Topic loadTopic(String lookup) {
    try {
      return (Topic) ic.lookup(lookup);
    } catch (NamingException ex) {
      logger.warning("Lookup for Topic " + lookup + " not found");
      return null;
    }
  }

  protected BaseJMS20 prep() {
    logger.info("Creating JMS context");
    int sessionType = JMSContext.AUTO_ACKNOWLEDGE;
    if (options.acknowledge()) {
      sessionType = JMSContext.CLIENT_ACKNOWLEDGE;
    } else if (options.transaction()) {
      sessionType = JMSContext.SESSION_TRANSACTED;
    }
    context = factory.createContext(sessionType);

    // For Quarkus the ClienID needs to be set here, as
    // soon as the context is obtained. So it is done here
    // for both standard and quarkus runtimes.
    if (options.durable() && Constants.DEST_TOPIC.equals(destinationType)) {
        context.setClientID(Constants.CLIENTID);
    }

    if (quarkusMode) {
      if (null != options.queueName()) {
        q = context.createQueue(options.queueName());
      }
      if (null != options.topicName()) {
        t = context.createTopic(options.topicName());
      }
    }

    return this;
  }


  protected BaseJMS20 close() {
    logger.info("Closing JMS Context");
    context.close();
    return this;
  }

  protected boolean verify() {
    switch(destinationType) {
      case Constants.DEST_QUEUE:
        if (null == q) {
          logger.warning("Queue has not been defined!");
          return false;
        }
        break;

      case Constants.DEST_TOPIC:
        if (null == t) {
          logger.warning("Topic has not been defined!");
          return false;
        }
        break;
    }
    return true;
  }

  protected void waitForABit(long period) {
    try {
      Thread.sleep(period);
    } catch (InterruptedException e) {}
  }

}
