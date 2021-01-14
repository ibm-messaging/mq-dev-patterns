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

public abstract class Constants {
  public static final long SECOND = 1000;
  public static final long MINUTE = 60 * SECOND;

  static final String TYPEA = "msgTypeA";
  static final String TYPEB = "msgTypeB";

  static final String DEST_QUEUE = "queue";
  static final String DEST_TOPIC = "topic";

  public static final String MODE_PUT = "put";
  public static final String MODE_GET = "get";
  public static final String MODE_BROWSE = "browse";

  static final String SYNC_ASYNC = "async";
  static final String SYNC_SYNC = "sync";

  static final String SELECTOR = "selector";
  static final String SELECTER = "selecter";
  static final String SELECT = "select";

  static final String EXPIRE = "expire";
  static final String EXPIRY = "expiry";

  static final String DELAY = "delay";

  static final String PERSIST = "persist";
  static final String PERSISTENT = "persistent";

  static final String CUSTOM = "custom";

  static final String REPLY = "reply";
  static final String RESPONSE = "response";

  static final String HIGH = "high";
  static final String LOW = "low";

  static final String DURABLE = "durable";
  static final String DURABLEID = "durableConsumerID";
  static final String CLIENTID = "durableClientID";

  static final String OBJECT = "object";
  static final String BYTES = "bytes";

  static final String ACK = "ack";
  static final String ACKNOWLEDGE = "acknowledge";
  static final String CLIENT_ACK = "clientack";

  static final String TRANSACT = "transact";
  static final String TRANSACTION = "transaction";
  static final String TRANSATION = "transation";

  static final String COMMA = ",";

  static final int TRANS_LIMIT = 2;

  static final int LOW_PRIORITY = 2;
  static final int MID_PRIORITY = 4;
  static final int HIGH_PRIORITY = 7;

  static final String TEXT_SYMBOL = " 🗒 TextMessage ";
  static final String BYTES_SYMBOL = " 🦁 BytesMessage ";
  static final String STREAM_SYMBOL = " 🏊 StreamMessage ";
  static final String OBJECT_SYMBOL = " 🦺 ObjectMessage ";
  static final String MAP_SYMBOL = " 🛄 MapMessage ";

  private Constants() {};
}
