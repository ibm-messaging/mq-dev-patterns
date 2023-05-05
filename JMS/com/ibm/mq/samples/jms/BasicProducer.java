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

import java.util.logging.*;

import javax.jms.Destination;
import javax.jms.JMSProducer;
import javax.jms.JMSContext;
import javax.jms.Message;
import javax.jms.JMSRuntimeException;

import com.ibm.mq.samples.jms.ConnectionHelper;
import com.ibm.mq.samples.jms.LoggingHelper;
import com.ibm.mq.samples.jms.ConsumerHelper;


public class BasicProducer {
    private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");

    public static final String PRODUCER_PUT = "queue";
    public static final String PRODUCER_PUB = "topic";

    private JMSContext context = null;
    private Destination destination = null;
    private JMSProducer producer = null;
    private ConnectionHelper ch = null;

    public BasicProducer(String type) {
        String id = null;

        switch(type){
            case PRODUCER_PUT :
                id = "Basic put";
                break;
            case PRODUCER_PUB :
                id = "Basic pub";
                break;
        }

        LoggingHelper.init(logger);
        logger.info("Sub application is starting");

        ch = new ConnectionHelper(id, ConnectionHelper.USE_CONNECTION_STRING);
        logger.info("created connection factory");

        context = ch.getContext();
        logger.info("context created");

        switch(type){
            case PRODUCER_PUB :
                destination = ch.getTopicDestination();
                break;
            case PRODUCER_PUT :
                destination = ch.getDestination();
                break;
        }

        // Set so no JMS headers are sent.
        ch.setTargetClient(destination);

        logger.info("destination created");

        producer = context.createProducer();
    }

    public void send(String message, int n_messages) {
        for (int i = 0; i < n_messages; i++) {
            logger.info("Publishing messages.\n");

            try {
                producer.send(destination, message);
                logger.info("message was sent");
                Thread.sleep(2000);
            } catch (JMSRuntimeException jmsex) {
                jmsex.printStackTrace();
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                }
            } catch (InterruptedException e) {
            }
        }
    }

    public void close() {
        ch.closeContext();
        ch = null;
    }
}
