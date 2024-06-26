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

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

import java.util.logging.Level;
import java.util.logging.Logger;

import org.junit.jupiter.api.BeforeAll;

public class JmsPubSubTest {
    //Add a custom logHandler to the logger to get the logs
    private static TestLogHandler logHandler;
    @BeforeAll
    public static void setUp(){
        Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");
        logger.setLevel(Level.ALL);
        logHandler = new TestLogHandler();
        logger.addHandler(logHandler);
    }

    //Test to verify JmsPub and JmsSub
    @Test
    public void testJmsPubSub(){
        //Create a thread for Subscription using JmsSub
        Thread subThread = new Thread(() -> {
            try {
                JmsSub.main(null);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });

        Thread pubThread = new Thread(() -> {
            try {
                JmsPub.main(null);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });

        subThread.start();
        //Wait for subscription to take place before publishing
        try {
            Thread.sleep(2000);
        } catch (Exception e) {
            e.printStackTrace();
        }
        pubThread.start();

        try {
            pubThread.join();
            subThread.interrupt();
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        //Assert successful subscription using the logs
        String logs = logHandler.getLogs();
        assertTrue(logs.contains("Sub application is starting"));
        assertTrue(logs.contains("consumer created"));
        assertTrue(logs.contains("Pub application is starting"));
        assertTrue(logs.contains("Publishing messages."));
        assertTrue(logs.contains("message was sent"));
        assertTrue(logs.contains("Received message: this is a message 0"));
        assertTrue(logs.contains("Received message: this is a message 19"));
    }
}
