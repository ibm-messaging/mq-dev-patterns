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

import com.ibm.mq.MQTopic;
import com.ibm.mq.constants.CMQC;
import com.ibm.mq.constants.MQConstants;


/*
 * This application uses the MQ Base Java classes to publish a message to a topic.
 * The topic name comes from the configuration file.
 */
public class BasicPub {

  private static final BasicLogger logger = new BasicLogger(BasicPub.class);

  public static void main(String[] args) {

    MQTopic topic;

    BasicProducer producer = new BasicProducer();
    BasicMQFunctions mqFunctions = new BasicMQFunctions();

    try {
      mqFunctions.connect();
      // Say how we are going to use the topic
      int openOptions = MQConstants.MQOO_OUTPUT | MQConstants.MQOO_FAIL_IF_QUIESCING;
      int openAs = CMQC.MQTOPIC_OPEN_AS_PUBLICATION;
      topic = mqFunctions.accessTopic(openOptions, openAs);

      String sampleMessage = "Message sent from BasicPub";
      String timestamp = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")) + " : ";

      // Use the common message send method to publish the text
      producer.putMessage(topic, timestamp + sampleMessage, null);
    } catch (Exception e) {
      logger.logException(e);
    } finally {
      mqFunctions.close();
    }

    System.exit(Globals.getExitCode());

  }
}