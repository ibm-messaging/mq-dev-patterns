/*
* (c) Copyright IBM Corporation 2019
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

import com.ibm.mq.samples.jms.BasicConsumer;

public class BasicSub {
    private static final int TIMEOUT = 10000; // 10 Seconnds

    public static void main(String[] args) {
        BasicConsumer bc = new BasicConsumer(BasicConsumer.CONSUMER_SUB, ConnectionHelper.USE_CONNECTION_STRING);
        bc.receive(TIMEOUT);
        bc.close();
    }
}
