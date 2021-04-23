/*
 * (c) Copyright IBM Corporation 2021
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

package com.ibm.mq.samples.jms.spring.level104;

import java.util.Map;

import com.ibm.mq.samples.jms.spring.globals.data.OurData;
import com.ibm.mq.samples.jms.spring.globals.data.OurOtherData;
import com.ibm.mq.samples.jms.spring.globals.utils.MessageUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Headers;


//@Component
public class MessageConsumer104 {
    protected final Log logger = LogFactory.getLog(getClass());

    // Even though this would be the better way to set the selector, it gives an error stating that the
    // selector needs to be a constant!
    //private static final String selector1 = Constants.DATATYPE + " = " + Constants.DataTypes.OURDATATYPE.toString();
    private static final String selector1 = "appdatatype = 10";
    private static final String selector2 = "appdatatype = 20";

    @JmsListener(destination = "${app.l104.queue.name2}", selector = selector1)
    public void receiveData(OurData message,
                            @Headers Map<String, Object> msgHeaders,
                            @Header("JMS_IBM_MsgType") Integer msgType,
                            @Header("JMSXDeliveryCount") Integer deliveryCount) {

        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info("Received message of type: " + message.getClass().getSimpleName());
        logger.info("Received message :" + message);
        logHeaders(msgHeaders, msgType, deliveryCount);
    }


    @JmsListener(destination = "${app.l104.queue.name2}", selector = selector2)
    public void receiveOther(OurOtherData message,
                             @Headers java.util.Map<String, Object> msgHeaders,
                             @Header("JMS_IBM_MsgType") Integer msgType,
                             @Header("JMSXDeliveryCount") Integer deliveryCount) {
        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info("Received message of type: " + message.getClass().getSimpleName());
        logger.info("Received message :" + message);
        logHeaders(msgHeaders, msgType, deliveryCount);
    }

    @JmsListener(destination = "${app.l104.queue.name2}")
    public void receiveOther(String message) {
        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info("Received message of type: " + message.getClass().getSimpleName());
        logger.info("Received message :" + message);
    }

    private void logHeaders(Map<String, Object> msgHeaders,
                            Integer msgType,
                            Integer deliveryCount) {
        MessageUtils.logHeaders(msgHeaders);
        logger.info("");
        logger.info("Message Type is " + msgType.toString());
        logger.info("Delivery Count  is " + deliveryCount.toString());
    }
}
