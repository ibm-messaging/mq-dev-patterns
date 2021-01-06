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

import java.util.List;

import java.util.logging.*;

public class Options  {
  private static final String MODE_DEFAULT = Constants.MODE_PUT;
  private static final String DEST_DEFAULT = Constants.DEST_QUEUE;
  private static final String SYNC_DEFAULT = Constants.SYNC_SYNC;

  private static final int PRIORITY_DEFAULT = Constants.MID_PRIORITY;

  private static final Boolean EXPIRE_DEFAULT = false;
  private static final Boolean DELAY_DEFAULT = false;
  private static final Boolean PERSIST_DEFAULT  = false;
  private static final Boolean CUSTOM_DEFAULT = false;
  private static final Boolean REPLY_DEFAULT = false;
  private static final Boolean SELECTOR_DEFAULT = false;
  private static final Boolean OBJECT_DEFAULT = false;
  private static final Boolean BYTES_DEFAULT = false;
  private static final Boolean DURABLE_DEFAULT = false;
  private static final Boolean ACKNOWLEDGE_DEFAULT = false;
  private static final Boolean TRANSACTION_DEFAULT = false;

  private static final int DEFAULT_PUT_COUNT = 1;

  protected static Logger log = null;

  private String mode = MODE_DEFAULT;
  private String destinationType = DEST_DEFAULT;
  private String syncMode = SYNC_DEFAULT;

  private Boolean expire = EXPIRE_DEFAULT;
  private Boolean delay = DELAY_DEFAULT;
  private Boolean persist = PERSIST_DEFAULT;
  private Boolean custom = CUSTOM_DEFAULT;
  private Boolean reply = REPLY_DEFAULT;
  private Boolean selector = SELECTOR_DEFAULT;
  private Boolean object = OBJECT_DEFAULT;
  private Boolean bytes = BYTES_DEFAULT;
  private Boolean durable = DURABLE_DEFAULT;
  private Boolean acknowledge = ACKNOWLEDGE_DEFAULT;
  private Boolean transaction = TRANSACTION_DEFAULT;

  private int priority = PRIORITY_DEFAULT;
  private int numberOfMessages = DEFAULT_PUT_COUNT;

  private String queueName = null;
  private String topicName = null;
  private String replyQueueName = null;

  public Options(Logger l) {
    log = l;
  }

  public Options mode(String m) { mode = m; return this;}

  public String mode() { return mode; }
  public String destinationType() { return destinationType; }
  public String syncMode() { return syncMode; }

  public Boolean expire() { return expire; }
  public Boolean delay() { return delay; }
  public Boolean persist() { return persist; }
  public Boolean custom() { return custom; }
  public Boolean reply() { return reply; }
  public Boolean selector() { return selector; }
  public Boolean object() { return object; }
  public Boolean bytes() { return bytes; }
  public Boolean durable() { return durable; }
  public Boolean acknowledge() { return acknowledge; }
  public Boolean transaction() { return transaction; }

  public int priority() { return priority; }
  public int numberOfMessages() { return numberOfMessages; }

  public Options queueName(String q) { queueName = q; return this;}
  public String queueName() { return queueName; }

  public Options replyQueueName(String rq) { replyQueueName = rq; return this;}
  public String replyQueueName() { return replyQueueName; }

  public Options topicName(String t) { topicName = t; return this;}
  public String topicName() { return topicName; }

  public Logger logger() { return log; }

  public Options logOptions() {
    log.info("-----------------------------");
    log.info("Run settings are :");
    log.info("    mode : " + mode);
    if (mode.equals(Constants.MODE_PUT)) {
      log.info("    number of message sets : " + numberOfMessages);
      log.info("    message expiry : " + expire);
      log.info("    message delay : " + delay);
      log.info("    message persistence : " + persist);
      log.info("    request / response : " + reply);
      log.info("    message priority : " + priority);
      log.info("    session transacted : " + transaction);
      log.info("    include ObjectMessage : " + object);
      log.info("    include BytesMessage : " + bytes);
    } else {
      log.info("    sync mode : " + syncMode);
      log.info("    get with selector : " + selector);
      log.info("    durable : " + durable);
    }
    log.info("    client acknowledge : " + acknowledge);
    log.info("    destination type : " + destinationType);
    log.info("-----------------------------");
    return this;
  }

  private void setSetting(String a) {
    String setting = a.toLowerCase();
    switch(a) {
      case Constants.MODE_PUT:
      case Constants.MODE_GET:
      case Constants.MODE_BROWSE:
        mode = setting;
        break;
      case Constants.DEST_QUEUE:
      case Constants.DEST_TOPIC:
        destinationType = setting;
        break;
      case Constants.SYNC_SYNC:
      case Constants.SYNC_ASYNC:
        syncMode = setting;
        break;
      case Constants.EXPIRE:
      case Constants.EXPIRY:
        expire = true;
        break;
      case Constants.PERSIST:
      case Constants.PERSISTENT:
        persist = true;
        break;
      case Constants.CUSTOM:
        custom = true;
        break;
      case Constants.DELAY:
        delay = true;
        break;
      case Constants.REPLY:
      case Constants.RESPONSE:
        reply = true;
        break;
      case Constants.SELECTOR:
      case Constants.SELECTER:
      case Constants.SELECT:
        selector = true;
        break;
      case Constants.OBJECT:
        object = true;
        break;
      case Constants.BYTES:
        bytes = true;
        break;
      case Constants.DURABLE:
        durable = true;
        break;
      case Constants.ACK:
      case Constants.ACKNOWLEDGE:
      case Constants.CLIENT_ACK:
        acknowledge = true;
        transaction = false;
        break;
      case Constants.TRANSACT:
      case Constants.TRANSACTION:
      case Constants.TRANSATION:
        transaction = true;
        acknowledge = false;
        break;
      case Constants.HIGH:
        priority = Constants.HIGH_PRIORITY;
        break;
      case Constants.LOW:
        priority = Constants.LOW_PRIORITY;
        break;
      default:
        try {
            numberOfMessages = Integer.parseInt(setting);
        } catch (NumberFormatException e) {}
        break;
    }
  }

  public Options parseArguments(List<String> args) {
    if (null != args) {
      for (String a : args) {
        setSetting(a);
      }
    }
    return this;
  };

  public Options parseArguments(String[] args) {
    if (args.length > 0) {
      for (String a : args) {
        if (a.contains(Constants.COMMA)) {
          parseArguments(a.split(Constants.COMMA));
        } else {
          setSetting(a);
        }
      }
    }
    return this;
  }

}
