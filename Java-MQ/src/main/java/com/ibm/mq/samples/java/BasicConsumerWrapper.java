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

import com.ibm.mq.constants.MQConstants;

import java.util.Hashtable;

import com.ibm.mq.*;

public class BasicConsumerWrapper {

    MQQueueManager qMgr = null;
    MQQueue queue = null;

    public void sendMessage() {

        SampleEnvSetter envSetter = new SampleEnvSetter();
        envSetter.setEnvValues();

        // iterate for every endpoint in env.json
        int length = envSetter.getDetails().size();
        System.out.println(length);

        for (int i = 0; i < length; i++) {
            MQDetails details = envSetter.getDetails().get(i);
            Hashtable<String,Object> props = envSetter.getProps().get(i);
            System.out.println("Wrapper: "+props);

            System.out.println("Wrapper QMGR: "+props);
            try {
                qMgr = new MQQueueManager(details.getQMGR(), props);
                System.out.println("Connected to queue manager: " + details.getQMGR());

                int openOptions = MQConstants.MQOO_INPUT_AS_Q_DEF;
                queue = qMgr.accessQueue(details.getQUEUE_NAME(), openOptions);

                System.out.println("Wrapper Queue: "+queue);

                boolean keepReading = true;
                BasicConsumer bc = new BasicConsumer();
                while (keepReading) {
                    keepReading = bc.getMessage(details, props, queue,BasicConsumer.CONSUMER_GET);
                }
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                try {
                    if (queue != null)
                        queue.close();
                    if (qMgr != null)
                        qMgr.disconnect();
                } catch (MQException me) {
                    me.printStackTrace();
                }
            }
        }
    }

}
