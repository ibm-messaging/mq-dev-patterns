/*
* (c) Copyright IBM Corporation 2025
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

import com.ibm.mq.MQException;
import com.ibm.mq.MQQueue;
import com.ibm.mq.MQQueueManager;
import com.ibm.mq.MQTopic;
import com.ibm.mq.constants.MQConstants;

public class BasicMQFunctions {

    MQDetails firstDetails = null;
    MQQueueManager qMgr = null;
    MQQueue queue = null;
    SampleEnvSetter envSetter = null;
    Hashtable<String,Object> props = new Hashtable<>();

    public BasicMQFunctions() {
        envSetter = new SampleEnvSetter();
        envSetter.setEnvValues();
    }

    public Hashtable<String,Object> buildConnection() {

        int numOfEndpoints = envSetter.getDetails().size();

        props = envSetter.getProps().get(1);

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
        Hashtable<String,Object> props = buildConnection();
        firstDetails = envSetter.getDetails().get(1);

        if (qMgr == null) {
            qMgr = new MQQueueManager(firstDetails.getQMGR(), props);
            System.out.println("Connected to queue manager: " + firstDetails.getQMGR());
        }

        return qMgr;
    }

    public MQQueue connectQueue(int openOptions) throws MQException {
        connect();

        queue = qMgr.accessQueue(firstDetails.getQUEUE_NAME(), openOptions);
        System.out.println("Queue opened: " + firstDetails.getQUEUE_NAME());

        return queue;
    }

    public MQTopic connectTopic(int topicOpenOptions, int openOptions) throws MQException {

        String topicName = "dev/";
        String topicObject = "DEV.BASE.TOPIC";

        connect();

        // Accessing the topic
        MQTopic topic = qMgr.accessTopic(topicName, topicObject, openOptions, topicOpenOptions);
        System.out.println("Connected to topic:" + topic.getName());
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
                me.printStackTrace();
            }
    }
}