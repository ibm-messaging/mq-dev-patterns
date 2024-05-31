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

import javax.jms.Destination;
import javax.jms.JMSConsumer;
import javax.jms.JMSContext;
import javax.jms.Message;

import org.junit.jupiter.api.Test;

public class JmsPubTest {
    private int messageCount = 0;
    JMSContext context = null;
    Destination destination = null;
    private ConnectionHelper ch = null;

    //Test to verify JmsPub
    @Test
    public void testJmsPub(){
        ch = new ConnectionHelper("Basic sub", 0);
        context = ch.getContext();
        destination = ch.getTopicDestination();

        //Create a thread for publisher
        Thread pubThread = new Thread(() -> {
            try {
                JmsPub.main(null);
            } catch (Exception e) {
                e.printStackTrace();
            }
            System.out.println("Publisher ended");
        });
        
        //Create a Thread for subscription
        Thread subThread = new Thread(() -> {
            JMSConsumer subscriber = context.createConsumer(destination);
            do  {
                Message msg = subscriber.receive(2000);
                if(msg != null) {
                    messageCount++;
                    //System.out.println(messageCount);
                }
            } while(messageCount < 20);
            System.out.println("Subscriber ended");
        });

        subThread.start();
        pubThread.start();
        try {
            subThread.join();
            pubThread.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        ch.closeContext();
        //Assert that the 20 messages published by the JmsPub are all recieved by the subscriber
        assertEquals(20, messageCount);
    }
}

