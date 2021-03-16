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

package com.ibm.mq.samples.jms.spring.level105;

import javax.jms.*;

import com.ibm.mq.samples.jms.spring.globals.Constants;
import com.ibm.mq.samples.jms.spring.globals.OurData;
import com.ibm.mq.samples.jms.spring.globals.OurOtherData;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

import java.io.Serializable;


//@Component
public class MessageConsumer105 {
    protected final Log logger = LogFactory.getLog(getClass());

    @JmsListener(destination = "${app.l105.queue.name2}")
    public void receiveData(Message message) {
        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info("Received message of type: " + message.getClass().getSimpleName());
        if (null != message) {
            checkMessageType(message);
        }
    }

    private void checkMessageType(Message message) {
        try {
            if (message instanceof TextMessage) {
                logger.info("Message matches TextMessage");
                logger.info("message payload is " + ((TextMessage) message).getText());
            } else if (message instanceof BytesMessage) {
                logger.info("Message matches BytesMessage");
            } else if (message instanceof MapMessage) {
                logger.info("Message matches MapMessage");
            } else if (message instanceof StreamMessage) {
                logger.info("Message matches StreamMessage");
            } else if (message instanceof ObjectMessage) {
                checkForObject((ObjectMessage) message);
            }
        } catch (JMSException e) {
            logger.warn("Unable to process JMS message");
        }

    }

    private void checkForObject(ObjectMessage message) {
        try {
            int typeValue = message.getIntProperty(Constants.DATATYPE);
            if (Constants.DataTypes.OURDATATYPE.getValue() == typeValue) {
                logger.info("It is one of our objects");
                Serializable serObj = message.getObject();
                OurData data = (OurData) serObj;
                logger.info(data);
            } else if (Constants.DataTypes.OUROTHERDATATYPE.getValue() == typeValue) {
                logger.info("It is one of our other objects");
                Serializable serObj = message.getObject();
                OurOtherData data = (OurOtherData) serObj;
                logger.info(data);
            } else {
                logger.warn("It is not one of our objects");
            }
        } catch (JMSException e) {
            logger.warn("Unable to retrieve message data");
        } catch (ClassCastException e2) {
            logger.warn("Not the object we were expecting");
        }
    }


    /*

        if (null != message) {
            try {

                    logger.info("Message matches ObjectMessage");
                    ObjectMessage obj = (ObjectMessage) message;
                    if (10 == obj.getIntProperty("AppSrcData")) {
                        logger.info("It is one of our objects");
                        Serializable serObj = obj.getObject();
                        try {
                            Comment data = (Comment) serObj;
                            logger.info(data.toString());
                        } catch (ClassCastException e2) {
                            logger.warn("Not the object we were expecting");
                        }

                        } else {
                        logger.warn("Unexpected object data");
                    }
                } else {
                    logger.warn("Message does not match jms message types");
                }
            } catch (JMSException e) {
                logger.warn("was unable to retrieve message data");
            }

     */


}
