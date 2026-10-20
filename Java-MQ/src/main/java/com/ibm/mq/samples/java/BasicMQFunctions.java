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
import java.util.HexFormat;
import java.util.logging.Level;

import com.ibm.mq.MQException;
import com.ibm.mq.MQQueue;
import com.ibm.mq.MQQueueManager;
import com.ibm.mq.MQTopic;
import com.ibm.mq.constants.MQConstants;

/*
 * This class provides a set of common routines used by the main Base Java sample programs.
 * In particular, connection to a qmgr is managed here.
 */
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

  /*
   * Build a connection string that defines how to reach a queue manager.
   * This will look something like "h1.example.com(1414),h2.example.com(1413)"
   */
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

    // Remove the trailing comma and put the value into the global properties set
    connList.setLength(connList.length() - 1);
    props.put("connectionString", connList.toString());

    return props;
  }

  /*
   * Connect to a queue manager using the available connection. If there is a list of
   * potential endpoints, the first one contains most of the details.
   */
  public MQQueueManager connect() throws MQException {
    props = buildConnection();
    firstDetails = envSetter.getDetails().get(0);

    if (qMgr == null) {
      qMgr = new MQQueueManager(firstDetails.getQMGR(), props);
      logger.log(Level.INFO, "Connected to queue manager: {0}", firstDetails.getQMGR());
    }

    return qMgr;
  }

  /*
   * Open a queue using the supplied MQOO open option values.
   */
  public MQQueue accessQueue(int openOptions) throws MQException {
    queue = qMgr.accessQueue(firstDetails.getQUEUE_NAME(), openOptions);
    logger.log(Level.INFO, "Queue opened: {0}", firstDetails.getQUEUE_NAME());

    return queue;
  }

  /*
   * Open a topic. If this is for a subscription, the topic object contains references to an
   * automatically-created publication queue.
   */
  public MQTopic accessTopic(int topicOpenOptions, int openOptions) throws MQException {
    // It is possible to use both a topic name and a topic object, which get combined to create
    // the full topic string. For these samples, we only use the topic name. This also matches
    // the JMS API which can only use a topic string. The topic object is passed as null.
    // Also, since this is a common routine, we can know that both publisher and subscriber
    // have a consistent view of the topic string.
    MQTopic topic = qMgr.accessTopic(firstDetails.getTOPIC_NAME(), null, openOptions, topicOpenOptions);

    // Report on the resulting topic string created from the combination of name/object. The way this is returned
    // can depend on whether it's for pub or sub. So we try both mechanisms.
    String realTopic = topic.getResolvedObjectString();
    if (realTopic == null) {
      realTopic = topic.getName();
    }
    logger.log(Level.INFO, "Topic opened: {0}", realTopic);

    return topic;
  }

  public MQDetails getFirstDetails() {
    return firstDetails;
  }

  /*
   *  Try to cleanup during exit processing
   */
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


  /*
   * Convert a byte array into a printable string
   */
  public static String getHexString(byte[] b) {
    try {
      return (b==null)?"": HexFormat.of().formatHex(b);
    } catch (Exception e) {
      return "";
    }
  }
}