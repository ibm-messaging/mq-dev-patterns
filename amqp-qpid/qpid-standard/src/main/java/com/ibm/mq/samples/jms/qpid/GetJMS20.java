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

import javax.jms.ConnectionFactory;
import javax.jms.DeliveryMode;
import javax.jms.Destination;
import javax.jms.JMSConsumer;
import javax.jms.JMSException;
import javax.jms.Message;

public class GetJMS20 extends BaseJMS20 {

  private String syncSetting = null;

  public GetJMS20 (Options o) {
    super(o);
    syncSetting = o.syncMode();
  }

  public GetJMS20 (Options o, ConnectionFactory cf) {
    super(o, cf);
    syncSetting = o.syncMode();
  }

  public GetJMS20 prep() {
    super.prep();
    return this;
  }

  static final String SYNC_ASYNC = "async";
  static final String SYNC_SYNC = "sync";

  public GetJMS20 get() {
    if (! verify()) {
      logger.severe("Not able to run sample");
    } else {
      switch(syncSetting) {
        case Constants.SYNC_SYNC:
          getSync();
          break;

        case Constants.SYNC_ASYNC:
          getAsync();
          logger.info("Pausing to allow async process to run, before app terminates");
          waitForABit(Constants.MINUTE);
          logger.info("Pause completed.");
          break;
      }
    }
    return this;
  }

  private void getSync() {
    logger.info("Creating message consumer");
    JMSConsumer mc = createConsumer();

    boolean incoming = true;
    while (incoming) {
      logger.info("Reading message");
      Inspector i = processMessage((Message) mc.receive(10 * Constants.SECOND));
      incoming = i.haveMessage();
    }
  }

  private void getAsync() {
    JMSConsumer mc = createConsumer();
    mc.setMessageListener(msg -> {
      this.msgListener(msg);
    });
  }

  private void msgListener(Message msg) {
    logger.info("Reading message");
    processMessage(msg);
  }


  private JMSConsumer createConsumer() {
    JMSConsumer mc = null;
    String selector = null;

    if (options.selector()) {
      selector = "JMSType = '" + Constants.TYPEA + "'";
    }

    switch(destinationType) {
      case Constants.DEST_QUEUE:
        mc = context.createConsumer(q, selector);
        break;
      case Constants.DEST_TOPIC:
        if (options.durable()) {
          // Client ID should already be set in BaseJMS20 prep()
          mc = context.createDurableConsumer(t, Constants.DURABLEID, selector, false);
        } else {
          mc = context.createConsumer(t, selector);
        }
        break;
    }
    return mc;
  }

  private Inspector processMessage(Message msg) {
    Inspector i = new Inspector(msg);
    try {
      i.showMessageType()
        .showMessageHeaders()
        .showProperties()
        .showMessageBody()
        ;

      if (options.acknowledge()) {
        i.acknowledge();
      }

      if (i.haveMessage()) {
        processResponse(i);
        logger.info("-----------------------------");
      }
    } catch (Exception ex) {
      ex.printStackTrace();
    }
    return i;
  }


  private void processResponse(Inspector i) {
    Destination replyDestination = i.getReplyDestination();
    if (null != replyDestination) {
      Message message = context.createTextMessage("This is a reply to message id : " + i.getID());
      context.createProducer()
        .setDeliveryMode(DeliveryMode.NON_PERSISTENT)
        .setJMSCorrelationID(i.getID())
        .send(replyDestination, message );

      try {
        if (options.acknowledge()) {
          message.acknowledge();
        }
      } catch (JMSException e) {
        logger.warning("client acknowledge failed : " + e.getMessage());
      }

    }
  }

  public GetJMS20 close() {
    super.close();
    return this;
  }

}
