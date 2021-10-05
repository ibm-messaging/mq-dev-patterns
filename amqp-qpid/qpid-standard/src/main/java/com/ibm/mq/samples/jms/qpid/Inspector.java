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

import java.util.ArrayList;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.Set;

import java.io.Serializable;

import javax.jms.BytesMessage;
import javax.jms.Destination;
import javax.jms.JMSException;
import javax.jms.MapMessage;
import javax.jms.Message;
import javax.jms.ObjectMessage;
import javax.jms.StreamMessage;
import javax.jms.TextMessage;

public class Inspector {
  private static final Level LOGLEVEL = Level.ALL;
  private static final Logger logger = Logger.getLogger("com.ibm.jms.qpid");

  Message message;

  Inspector(Message msg) {
    message = msg;
  }

  public Message getMessage() {
    return message;
  }

  public boolean haveMessage() {
    return (null != message);
  }

  public Inspector acknowledge() {
    try {
      if (haveMessage()) {
        message.acknowledge();
      }
    } catch (JMSException e) {
      logger.warning("client acknowledge failed : " + e.getMessage());
    }
    return this;
  }

  public Destination getReplyDestination() {
    if (null == message) {
      return null;
    }
    try {
      return message.getJMSReplyTo();
    } catch (JMSException e) {
      logger.info("No reply to destination");
      return null;
    }
  }

  public String getID() {
    if (null == message) {
      return null;
    }
    try {
      return message.getJMSMessageID();
    } catch (JMSException e) {
      logger.info("No message ID");
      return null;
    }
  }

  public Inspector showMessageHeaders() throws JMSException {
    if (null != message) {
      logger.info("Message Header Fields ");
      logger.info("  Destination : " + message.getJMSDestination());
      logger.info("  Delivery mode : " + message.getJMSDeliveryMode());
      logger.info("  Message ID : " + message.getJMSMessageID());
      logger.info("  Correlation ID : " + message.getJMSCorrelationID());
      logger.info("  Timestamp : " + message.getJMSTimestamp());
      logger.info("  Redlivered : " + message.getJMSRedelivered());
      logger.info("  Expiration : " + message.getJMSExpiration());
      logger.info("  Priority : " + message.getJMSPriority());
      logger.info("  Type : " + message.getJMSType());
      logger.info("  ReplyTo : " + message.getJMSReplyTo());
    } else {
      logger.info("Message is null ");
    }

    return this;
  }

  public Inspector showMessageType() {
    if (null != message) {
      logger.info("Message is of type : " + message.getClass());
      if (message instanceof TextMessage) {
        logger.info("Message matches TextMessage");
      } else if (message instanceof BytesMessage) {
        logger.info("Message matches BytesMessage");
      } else if (message instanceof MapMessage) {
        logger.info("Message matches MapMessage");
      } else if (message instanceof StreamMessage) {
        logger.info("Message matches StreamMessage");
      } else if (message instanceof ObjectMessage) {
        logger.info("Message matches ObjectMessage");
      }

    }
    return this;
  }

  public Inspector showMessageBody() {
    try {
      if (null == message) {
        logger.info("No message received");
      } else if (message instanceof TextMessage) {
        TextMessage textMessage = (TextMessage) message;
        logger.info("Received message: " + textMessage.getText());
      } else if (message instanceof BytesMessage) {
        BytesMessage bytesMessage = (BytesMessage) message;
        logger.info("" + bytesMessage.readInt());
        logger.info(bytesMessage.readUTF());
        logger.info(bytesMessage.readUTF());
      } else if (message instanceof StreamMessage) {
        logger.warning("not expecting this as StreamMessage is being received as ObjectMessage");
      } else if (message instanceof MapMessage) {
        logger.warning("not expecting this as MapMessage is being received as ObjectMessage");
      } else if (message instanceof ObjectMessage) {
        ObjectMessage objectMessage = (ObjectMessage) message;
        // StreamMessage is transfered as ObjectMessage, containing ArrayList
        Serializable serObj = objectMessage.getObject();
        try {
          ArrayList list = (ArrayList) serObj;
          logger.info("Parsing returned array");
          for (Object elem: list) {
            logger.info("Element is of type : " + elem.getClass());
            logger.info("value :" + elem);
          }
        } catch (ClassCastException e1) {
          logger.info(e1.getMessage());
          // ObjectMessage will contain serialized object type
          try {
            Data data = (Data) serObj;
            logger.info(data.toString());
          } catch (ClassCastException e2) {
            logger.info(e2.getMessage());
            // MapMessage is transfered as ObjectMessage, containing LinkedHashMap
            try {
              LinkedHashMap map = (LinkedHashMap) serObj;
              Set<String> keys = map.keySet();
              if (null != keys) {
                for (String k: keys) {
                  logger.info(k + " : " + map.get(k));
                }
              }
            } catch (ClassCastException e3) {
              logger.info(e3.getMessage());
            }

          }
        }
      } else if (message instanceof Message) {
        logger.info("Message received was of type Message.\n");
      } else {
        logger.info("Received object not of JMS Message type!\n");
      }
    } catch (JMSException jmsex) {
      recordFailure(jmsex);
    }

    return this;
  }

  public Inspector showProperties() {
    if (null != message) {
      try {
        Enumeration props = message.getPropertyNames();
        if (null == props) {
          logger.info("No properties found");
        } else {
          logger.info("Properties : ");
          while (props.hasMoreElements()) {
            String p = (String) props.nextElement();
            switch (p) {
              case Constants.TYPEA:
              case Constants.TYPEB:
                logger.info("  " + p + " : " + message.getBooleanProperty(p));
                break;
              default:
                logger.info("  " + p);
                break;
            }
          }
        }
      } catch (JMSException e) {
        logger.info("No properties found");
      }
    }
    return this;
  }

  private void recordFailure(Exception ex) {
    if (ex != null) {
      if (ex instanceof JMSException) {
        processJMSException((JMSException) ex);
      } else {
        logger.info(ex.getMessage());
      }
    }
    System.out.println("FAILURE");
    return;
  }

  private void processJMSException(JMSException jmsex) {
    logger.info(jmsex.getMessage());
    Throwable innerException = jmsex.getLinkedException();
    logger.info("Exception is: " + jmsex);
    if (innerException != null) {
      logger.info("Inner exception(s):");
    }
    while (innerException != null) {
      logger.info(innerException.getMessage());
      innerException = innerException.getCause();
    }
    return;
  }

}
