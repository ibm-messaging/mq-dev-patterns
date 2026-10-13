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

import java.util.Hashtable;
import java.util.logging.Level;

import com.ibm.mq.MQException;
import com.ibm.mq.MQQueue;
import com.ibm.mq.MQQueueManager;
import com.ibm.mq.MQTopic;
import com.ibm.mq.constants.MQConstants;

public class BasicMQFunctions {

  private static final BasicLogger logger = new BasicLogger(BasicMQFunctions.class);

  MQDetails firstDetails = null;
  MQQueueManager qMgr = null;
  MQQueue queue = null;
  EnvSetter envSetter = null;
  Hashtable<String,Object> props = new Hashtable<>();

  public BasicMQFunctions() {
    envSetter = new EnvSetter();
    envSetter.setEnvValues();
  }

  public Hashtable<String,Object> buildConnection() {

    int numOfEndpoints = envSetter.getDetails().size();

    props = envSetter.getProps().get(0);

    // Remove this env port and host
    props.remove(MQConstants.HOST_NAME_PROPERTY);
    props.remove(MQConstants.PORT_PROPERTY);

    // Build connection string
    StringBuilder connList = new StringBuilder();
    for (int i = 0; i < numOfEndpoints; i++) {
      firstDetails = envSetter.getDetails().get(i);
      connList.append(firstDetails.getHOST()).append("(").append(firstDetails.getPORT()).append("),");
    }
    // Remove last comma
    connList.setLength(connList.length() - 1);

    // Put into properties
    props.put("connectionString", connList.toString());

    return props;
  }

  public MQQueueManager connect() throws MQException {
    props = buildConnection();
    firstDetails = envSetter.getDetails().get(0);

    if (qMgr == null) {
      qMgr = new MQQueueManager(firstDetails.getQMGR(), props);
      logger.log(Level.INFO, "Connected to queue manager: {0}", firstDetails.getQMGR());
    }

    return qMgr;
  }

  public MQQueue accessQueue(int openOptions) throws MQException {

    queue = qMgr.accessQueue(firstDetails.getQUEUE_NAME(), openOptions);
    logger.log(Level.INFO, "Queue opened: {0}", firstDetails.getQUEUE_NAME());

    return queue;
  }

  public MQTopic accessTopic(int topicOpenOptions, int openOptions) throws MQException {

    // Accessing the topic
    MQTopic topic = qMgr.accessTopic(firstDetails.getTOPIC_NAME(), firstDetails.getTOPIC_OBJECT(), openOptions, topicOpenOptions);
    logger.log(Level.INFO, "Connected to topic: {0}", topic.getName());
    return topic;
  }

  public MQDetails getFirstDetails() {
    return firstDetails;
  }

  public Hashtable<String,Object> getProps() {
    return props;
  }

  public void close() {
    try {
      if (queue != null) {
        queue.close();
      }
      if (qMgr != null) {
        qMgr.disconnect();
      }
    } catch (MQException me) {
      logger.log(Level.WARNING, "Exception during close: {0}", me.getMessage());
    }
  }
}