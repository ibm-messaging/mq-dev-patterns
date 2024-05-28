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

import javax.jms.JMSConsumer;
import javax.jms.JMSContext;
import javax.jms.JMSException;
import javax.jms.Destination;
import javax.jms.Message;
import javax.jms.TextMessage;
import javax.jms.JMSRuntimeException;

import org.junit.jupiter.api.Test;

import com.ibm.mq.MQException;
import com.ibm.mq.constants.MQConstants;


public class JmsPutTest {
    private JMSContext context = null;
    private Destination destination = null;
    private JMSConsumer consumer = null;
    private ConnectionHelper ch = null;
    private static long TIMEOUTTIME = 5000;

    //Test to verify the working of JmsPut application
    //It first runs the JmsPut, the creates a consumer to consume and verify those messages
    @Test
    public void testJmsPut(){
        //Clear the queue for any existing messages
        clearQueue();
        //Run JmsPut application
        JmsPut.main(null);
        //Create a connection for consumer
        ch = new ConnectionHelper("Basic Get", 0);
        context = ch.getContext();
        destination = ch.getDestination();
        consumer = context.createConsumer(destination);
        //Consume the messages put by JmsPut
        for(int i = 1 ; i <= 10 ; i++){
            try {
                Message recievedMessage = consumer.receive(TIMEOUTTIME);
                String value = "This is message number " + i + ".";
                String message = getMessageBody(recievedMessage);
                //assert each message
                assertEquals(value, message);
                waitAWhile(1000);
            } catch (JMSRuntimeException jmsex) {
                jmsex.printStackTrace();
                waitAWhile(1000);
            }
        }
        //Close the connection
        ch.closeContext();
    }

    //Test to verify the execption thrown when the QM name is Invalid
    @Test
    public void testIncorrectQM(){ 
        System.setProperty("QMGR", "INVALID_QM");
        JMSRuntimeException jmsex = assertThrows(JMSRuntimeException.class , () -> {
            JmsPut.main(null);
        });
        
        MQException inException = (MQException) jmsex.getCause();
        assertEquals(MQConstants.MQRC_Q_MGR_NAME_ERROR, inException.getReason());
        System.clearProperty("QMGR");
    }

    //Test to verify the execption thrown when Queue name is Invalid
    @Test
    public void testIncorrectQueue(){
        System.setProperty("QUEUE_NAME" , "INVALID_QUEUE");
        JMSRuntimeException jmsex = assertThrows(JMSRuntimeException.class, () -> {
            JmsPut.main(null);
        });

        MQException inException = (MQException) jmsex.getCause();
        assertEquals(MQConstants.MQRC_UNKNOWN_OBJECT_NAME, inException.getReason());
        System.clearProperty("QUEUE_NAME");
    }

    //Test to verify the execption thrown when Channel name is Incorrect
    @Test
    public void testIncorrectChannel(){
        System.setProperty("CHANNEL" , "INCORRECT_CHANNEL");
        JMSRuntimeException jmsex = assertThrows(JMSRuntimeException.class, () -> {
            JmsPut.main(null);
        });
        MQException inException = (MQException) jmsex.getCause();
        assertEquals(MQConstants.MQRC_UNKNOWN_CHANNEL_NAME, inException.getReason());
        System.clearProperty("CHANNEL");
    }

    //This function creates a consumer and consumes any messages on the queue
    private void clearQueue(){
        BasicConsumer bc = new BasicConsumer(BasicConsumer.CONSUMER_GET, 0);
        //Timesout if no message is recieved after 1000ms
        bc.receive(1000);
        bc.close();
    }

    //Return the message string from Message object
    private static String getMessageBody(Message receivedMessage) {
        if (receivedMessage instanceof TextMessage) {
            TextMessage textMessage = (TextMessage) receivedMessage;
            try {
                return textMessage.getText();
            } catch (JMSException jmsex) {
                return "Error getting a message";
            }
        } else if (receivedMessage instanceof Message) {
            return "Message received was not of type TextMessage.";
        } else {
            return "Received object not of JMS Message type!";
        }
    }

    private static void waitAWhile(int duration) {
        try {
            Thread.sleep(duration);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

}
