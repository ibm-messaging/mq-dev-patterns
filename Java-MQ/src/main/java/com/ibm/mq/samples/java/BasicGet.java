/*
 * (c) Copyright IBM Corporation 2026
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
package com.ibm.mq.samples.java;

import java.util.logging.Level;

import com.ibm.mq.MQQueue;
import com.ibm.mq.constants.MQConstants;

public class BasicGet {
  private static final BasicLogger logger = new BasicLogger(BasicGet.class);

  public static final int DEFAULT_GET_VALUE = 1;

  public static void main(String[] args) {

    BasicMQFunctions mqFunctions = new BasicMQFunctions();
    BasicConsumer basicConsumer = new BasicConsumer();

    // How many messages to get from queue, if not specified use default value
    int count = (args.length > 0) ? Integer.parseInt(args[0]) : DEFAULT_GET_VALUE;

    logger.log(Level.INFO, "Will try to get {0} messages", count);
    // Connect, get messages, disconnect
    try {
      mqFunctions.connect();
      int openOptions = MQConstants.MQOO_INPUT_AS_Q_DEF;
      MQQueue queue = mqFunctions.accessQueue(openOptions);

      while (count > 0) {
        boolean msgReturned = basicConsumer.getMessage(queue, BasicConsumer.CONSUMER_GET);
        if (msgReturned) {
          count--;
        } else {
          break;
        }
      }
    } catch (Exception e) {
      logger.logException(e);
    } finally {
      mqFunctions.close();
    }
    System.exit(Globals.getExitCode());

  }
}