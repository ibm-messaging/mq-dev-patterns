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

package com.ibm.mq.samples.jms;

import java.util.logging.*;
import javax.jms.JMSRuntimeException;

import com.ibm.mq.samples.jms.BasicConsumer;
import com.ibm.mq.samples.jms.SampleEnvSetter;


public class BasicConsumerWrapper {
    private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");
    private static final int TIMEOUT = 5000; // 5 Seconnds

    public static void performGet() {
        SampleEnvSetter env = new SampleEnvSetter();
        int limit = env.getCount();
        logger.info("There are " + limit + " endpoints");

        for (int index = 0; index < limit; index++) {
            try {
                BasicConsumer bc = new BasicConsumer(BasicConsumer.CONSUMER_GET, index);
                bc.receive(TIMEOUT);
                bc.close();
            } catch (JMSRuntimeException ex) {
                if (! StatusChecker.getCanContinue(ex)) {
                    break;
                }
            }
        }
    }
}
