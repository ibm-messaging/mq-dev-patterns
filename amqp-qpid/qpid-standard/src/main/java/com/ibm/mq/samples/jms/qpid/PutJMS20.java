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

import javax.jms.BytesMessage;
import javax.jms.ConnectionFactory;
import javax.jms.DeliveryMode;
import javax.jms.JMSConsumer;
import javax.jms.JMSException;
import javax.jms.JMSProducer;
import javax.jms.MapMessage;
import javax.jms.Message;
import javax.jms.ObjectMessage;
import javax.jms.Queue;
import javax.jms.StreamMessage;
import javax.jms.TemporaryQueue;
import javax.jms.TextMessage;

public class PutJMS20 extends BaseJMS20 {
  private JMSProducer destination = null;
  private Queue replyQueue = null;

  public PutJMS20 (Options o) {
    super(o);
  }

  public PutJMS20 (Options o, ConnectionFactory cf) {
    super(o, cf);
  }

  public PutJMS20 prep() {
    logger.info("Creating JMS context");
    super.prep();
    try {
      logger.info("Creating destination");
      destination =
        context.createProducer()
          .setDeliveryMode(DeliveryMode.NON_PERSISTENT)
          .setPriority(options.priority())
          .setJMSType(Constants.TYPEA)
          ;

      if (options.persist()) {
        destination.setDeliveryMode(DeliveryMode.PERSISTENT);
      }
      if (options.delay()) {
        destination.setDeliveryDelay(30 * Constants.SECOND);
      }
      if (options.expire()) {
        logger.info("Setting message expiration");
        destination.setTimeToLive(2 * Constants.MINUTE);
      }

      if (options.reply()) {
        logger.info("Setting reply to");
        if (null != rq) {
          logger.info("Setting reply to requested queue");
          destination.setJMSReplyTo(rq);
          replyQueue = rq;
        } else {
          logger.info("Setting reply to temporary queue");
          TemporaryQueue trq = context.createTemporaryQueue();
          destination.setJMSReplyTo(trq);
          replyQueue = trq;
        }
      }

    } catch (Exception ex) {
      ex.printStackTrace();
    }
    return this;
  }


  public PutJMS20 send(String text) {
    if (! verify()) {
      logger.severe("Not able to run sample");
      return this;
    }
    int quantity = options.numberOfMessages();

    logger.info("Sending " + quantity + " message batches");

    try {
      if (null != destination && 0 < quantity) {
        for (int i = 0; i < quantity; i++) {
          int place = i + 1;
          logger.info("Sending message " + place + " of " + quantity);
          logger.info("Creating Messages");

          //TextMessage message = context.createTextMessage(place + " : " + text);
          Message[] msgs = createMessages(place, text);

          for (Message message : msgs) {
            if (options.custom()) {
              message.setBooleanProperty(Constants.TYPEA, true);
              message.setBooleanProperty(Constants.TYPEB, false);
            }

            logger.info("Sending message via producer");

            switch(destinationType) {
              case Constants.DEST_QUEUE:
                destination.send(q, message);
                break;
              case Constants.DEST_TOPIC:
                destination.send(t, message);
                break;
            }
            if (options.acknowledge()) {
              logger.info("acknowledging messages");
              message.acknowledge();
            } else if (options.transaction() && Constants.TRANS_LIMIT == i) {
              logger.info("commiting messages");
              context.commit();
            }

            new Inspector(message)
              .showMessageType()
              .showMessageHeaders()
              .showProperties()
              ;

          }
          waitForABit(Constants.SECOND);
          if (options.reply()) {
            logger.info("Expecting some replies");
            processReplies();
          }
        }
        if (options.transaction()) {
          logger.info("Rolling back messages");
          context.rollback();
        }
      }
    } catch (Exception ex) {
      ex.printStackTrace();
    }

    return this;
  }

  public PutJMS20 close() {
    super.close();
    return this;
  }

  private Message[] createMessages(int place, String text) {
    return new Message[] {
      context.createTextMessage(place + Constants.TEXT_SYMBOL + text)
      ,createBytesMessage(place, text)
      ,createStreamMessage(place, text)
      ,createObjectMessage(place, text)
      ,createMapMessage(place, text)
    };
  }

  private Message createBytesMessage(int place, String text) {
    if (options.bytes()) {
      logger.info("Creating Bytes Message");
      BytesMessage bm = context.createBytesMessage();
      try {
        bm.writeInt(place);
        bm.writeUTF(Constants.BYTES_SYMBOL);
        bm.writeUTF(text);
      } catch (JMSException e) {
        logger.warning("Error building BytesMessage " + e.getErrorCode());
      }
      logger.info("Bytes Message created");
      return bm;
    } else {
      return context.createTextMessage(place + Constants.TEXT_SYMBOL +
                                          ": in lieu of " + Constants.BYTES_SYMBOL +
                                          text);
    }

  }

  private StreamMessage createStreamMessage(int place, String text) {
    logger.info("Creating Stream Message");
    StreamMessage sm = context.createStreamMessage();
    try {
      sm.writeInt(place);
      sm.writeString(Constants.STREAM_SYMBOL);
      sm.writeString(text);
    } catch (JMSException e) {
      logger.warning("Error building StreamMessage " + e.getErrorCode());
    }
    logger.info("Stream Message created");
    return sm;
  }

  private Message createObjectMessage(int place, String text) {
    if (options.object()) {
      logger.info("Creating Object Message");
      ObjectMessage om = context.createObjectMessage();
      try {
        logger.info("Setting Object");
        om.setObject(new Data(place, Constants.OBJECT_SYMBOL, text));
        return om;
      } catch (JMSException e) {
        logger.warning("JMS Exception building ObjectMessage " + e.getErrorCode());
      } catch (Exception e) {
        logger.warning("Exception building ObjectMessage " + e.getCause());
      } catch (Error e) {
        logger.warning("Error building ObjectMessage " + e.getMessage());
        e.printStackTrace();
      }
      logger.info("Object Message created");
    }
    // If we get to here then an ObjectMessage creation failed.
    return context.createTextMessage(place + Constants.TEXT_SYMBOL +
                                      ": in lieu of " + Constants.OBJECT_SYMBOL +
                                      text);
  }

  private MapMessage createMapMessage(int place, String text) {
    logger.info("Creating Map Message");
    MapMessage mm = context.createMapMessage();
    try {
      mm.setInt("place", place);
      mm.setString("utf string", Constants.MAP_SYMBOL);
      mm.setString("message text", text);
    } catch (JMSException e) {
      logger.warning("Error building MapMessage " + e.getErrorCode());
    }
    logger.info("Map Message created");
    return mm;
  }

  private void processReplies() {
    JMSConsumer mc = null;
    mc = context.createConsumer(replyQueue);
    boolean incoming = true;
    while (incoming) {
      logger.info("Reading reply message");
      incoming = processMessage((Message) mc.receive(10 * Constants.SECOND)).haveMessage();
    }
  }

  private Inspector processMessage(Message msg) {
    Inspector i = new Inspector(msg);
    try {
      i.showMessageType()
        .showMessageBody()
        ;
      if (options.acknowledge()) {
        i.acknowledge();
      }
    } catch (Exception ex) {
      ex.printStackTrace();
    }
    return i;
  }

}
