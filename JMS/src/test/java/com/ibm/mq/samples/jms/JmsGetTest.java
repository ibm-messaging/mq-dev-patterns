/*
* (c) Copyright IBM Corporation 2024
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

import static org.junit.jupiter.api.Assertions.*;

import java.util.Enumeration;

import javax.jms.JMSContext;
import javax.jms.JMSException;
import javax.jms.Queue;
import javax.jms.QueueBrowser;

import org.junit.jupiter.api.Test;

public class JmsGetTest {
    private JMSContext context = null;
    private Queue destination = null;
    private QueueBrowser browser = null;
    private ConnectionHelper ch = null;

    //Test to verify working of JmsGet
    @Test
    public void testJmsGet(){
        //Put messages to the queue
        JmsPut.main(null);
        //Run JmsGet to get all the messages
        JmsGet.main(null);
        
        ch = new ConnectionHelper("Basic Get", 0);
        context = ch.getContext();
        destination = (Queue)ch.getDestination();
        browser = context.createBrowser(destination);
        try {
            //Browse the queue to verify no existing messages in the queue as JmsGet was called.
            Enumeration<?> messages = browser.getEnumeration();
            assertFalse(messages.hasMoreElements());
        } catch (JMSException jmsex) {
            jmsex.printStackTrace();
        }
        ch.closeContext();;
    }
    
}
