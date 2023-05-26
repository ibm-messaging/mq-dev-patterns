/*
 * (c) Copyright IBM Corporation 2021, 2023
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

package com.ibm.mq.samples.jms.spring.globals.handlers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ibm.mq.samples.jms.spring.globals.data.OurData;
import com.ibm.mq.samples.jms.spring.globals.data.OurOtherData;
import com.ibm.mq.samples.jms.spring.globals.data.ReplyData;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.jms.support.converter.MessageConversionException;
import org.springframework.jms.support.converter.MessageConverter;

import jakarta.jms.*;

public class OurMessageConverter implements MessageConverter {
    protected final Log logger = LogFactory.getLog(getClass());

    private static ObjectMapper mapper = new ObjectMapper();

    @Override
    public Message toMessage(Object o, Session session) throws JMSException, MessageConversionException {
        logger.info("In toMessage converter");

        String payload = null;
        Message message = null;

        try {
            if (o instanceof Message) {
                message = (Message) o;
            }
            if (o instanceof OurData) {
                logger.info("Marshalling OurData");
                OurData data = (OurData) o;
                payload = mapper.writeValueAsString(data);
                message = session.createTextMessage(payload);
            } else if (o instanceof OurOtherData) {
                logger.info("Marshalling OurOtherData");
                OurOtherData data = (OurOtherData) o;
                payload = mapper.writeValueAsString(data);
                message = session.createTextMessage(payload);
            } else if (o instanceof ReplyData) {
                logger.info("Marshalling ReplyData");
                ReplyData data = (ReplyData) o;
                payload = mapper.writeValueAsString(data);
                message = session.createTextMessage(payload);
            } else if (o instanceof String) {
                logger.info("Marshalling String");
                message = session.createTextMessage((String)o);
            }
        } catch (JsonProcessingException e) {
            logger.warn("Unable to convert into json string");
        }

        if (null != message) {
            message.setJMSDeliveryMode(DeliveryMode.NON_PERSISTENT);
            logger.info("sending message ");
            return message;
        } else {
            throw new MessageConversionException("Object wasn't what we were expecting");
        }
    }


    @Override
    public Object fromMessage(Message message) throws JMSException, MessageConversionException {
        logger.info("In formMessage converter");

        if (message instanceof MapMessage) {
            logger.info("Have a MapMessage");
        } else if (message instanceof TextMessage) {
            try {
                logger.info("Have a TextMessage");
                TextMessage txtmsg = (TextMessage) message;
                String payload = txtmsg.getText();
                logger.info("payload is : " + payload);
                OurData data = mapper.readValue(payload, OurData.class);
                return data;
            } catch (JsonProcessingException e) {
                logger.warn("Unable to parse json from object");
                logger.warn(e.getMessage());
            }
        }
        return null;
    }

    public OurData fromString(String msg) {
        try {
            OurData data = mapper.readValue(msg, OurData.class);
            return data;
        } catch (JsonProcessingException e) {
            logger.warn("Unable to parse json from string");
            logger.warn(e.getMessage());
        }
        return null;
    }

    public ReplyData replyFromMessage(Message message) {
        try {
            if (message instanceof TextMessage) {
                TextMessage txtmsg = (TextMessage) message;
                String payload = txtmsg.getText();
                ReplyData rr = mapper.readValue(payload, ReplyData.class);
                return rr;
            }
        } catch (JsonProcessingException e) {
            logger.warn("Unable to parse json into object");
            logger.warn(e.getMessage());
        } catch(JMSException e) {
            logger.warn("Unable to process JMS Message");
            logger.warn(e.getMessage());
        }
        return null;
    }

    public <T> String toJsonString(T data) {
        try {
            return mapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            logger.warn("Unable to parse json from object");
            logger.warn(e.getMessage());
            return null;
        }
    }

}
