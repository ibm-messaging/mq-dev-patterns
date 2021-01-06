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

import java.util.Enumeration;

import javax.jms.ConnectionFactory;
import javax.jms.JMSException;
import javax.jms.Message;
import javax.jms.QueueBrowser;

public class BrowseJMS20 extends BaseJMS20 {

  private String syncSetting = null;

  public BrowseJMS20 (Options o) {
    super(o);
  }

  public BrowseJMS20 (Options o, ConnectionFactory cf) {
    super(o, cf);
  }

  public BrowseJMS20 prep() {
    super.prep();
    return this;
  }

  public BrowseJMS20 browse() {
    if (! verify()) {
      logger.severe("Not able to run sample");
    } else {
      browseMessages();
    }
    return this;
  }

  private void browseMessages() {
    logger.info("Creating message consumer");

    try {
      QueueBrowser qb = context.createBrowser(q);
      Enumeration messages = qb.getEnumeration();

      logger.info("Checking for messages");
      while (messages.hasMoreElements()) {
        logger.info("Reading message");
        Inspector i = processMessage((Message) messages.nextElement());
      }
      logger.info("No more messages");
    } catch (JMSException e) {
      logger.warning("Error trying to browse messages " + e.getErrorCode());
    } catch (Exception e) {
      logger.warning("Unexpected exception whilst browsing");
      e.printStackTrace();
    }
  }


  private Inspector processMessage(Message msg) {
    Inspector i = new Inspector(msg);
    try {
      i.showMessageType()
        .showMessageHeaders()
        .showProperties()
        .showMessageBody()
        ;
    } catch (Exception ex) {
      ex.printStackTrace();
    }
    return i;
  }

  public BrowseJMS20 close() {
    super.close();
    return this;
  }

}
