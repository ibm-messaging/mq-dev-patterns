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

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.logging.Level;

import com.ibm.mq.MQQueue;
import com.ibm.mq.constants.MQConstants;

public class BasicPut {
  private static final BasicLogger logger = new BasicLogger(BasicPut.class);

  public static final int DEFAULT_PUT_COUNT = 1;

  public static void main(String[] args) {

    BasicMQFunctions mqFunctions = new BasicMQFunctions();
    BasicProducer basicProducer = new BasicProducer();

    String sampleMessage = "Message sent from BasicPut";

    // How many messages to put to queue, if not specified use default value
    int count = (args.length > 0) ? Integer.parseInt(args[0]) : DEFAULT_PUT_COUNT;
    logger.log(Level.INFO, "Will try to put {0} messages", count);

    // Connect using the connection string
    try {
      mqFunctions.connect();

      int openOptions = MQConstants.MQOO_OUTPUT | MQConstants.MQOO_FAIL_IF_QUIESCING;
      MQQueue queue = mqFunctions.accessQueue(openOptions);

      // Put messages on the queue
      while (count > 0) {
        String timestamp = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")) + " : ";
        basicProducer.putMessage(queue, BasicProducer.PRODUCER_PUT, timestamp + sampleMessage, null);
        count--;
        try {
          Thread.sleep(1000);
        } catch (InterruptedException e) {
          // Do nothing
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