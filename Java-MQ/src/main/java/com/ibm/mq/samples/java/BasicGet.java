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

/*
 * This application uses the MQ Base Java classes to get or browse messages from a queue.
 * The queue name comes from the configuration file.
 */
public class BasicGet {
  private static final BasicLogger logger = new BasicLogger(BasicGet.class);

  public static final int DEFAULT_GET_VALUE = 1;

  public static void main(String[] args) {

    BasicMQFunctions mqFunctions = new BasicMQFunctions();
    BasicConsumer basicConsumer = new BasicConsumer();

    // How many messages to get from queue, if not specified use default value
    int count = (args.length > 0) ? Integer.parseInt(args[0]) : DEFAULT_GET_VALUE;

    // If a 2nd parameter is supplied and it is "BROWSE", then use that option. Otherwise
    // retrieve messages destructively
    boolean browse = (args.length > 1) ? args[1].equalsIgnoreCase("BROWSE"): false;

    logger.log(Level.INFO, "Will try to get {0} messages. Browse: {1}", new Object[]{count,browse});

    try {
      mqFunctions.connect();

      // Open the queue, saying that it will be use either GET or BROWSE operations
      int openOptions = browse?MQConstants.MQOO_BROWSE: MQConstants.MQOO_INPUT_AS_Q_DEF;
      MQQueue queue = mqFunctions.accessQueue(openOptions);

      // Get the messages using a common method.
      while (count > 0) {
        boolean msgReturned = browse?basicConsumer.browseMessage(queue):basicConsumer.getMessage(queue);
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
