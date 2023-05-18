package com.ibm.mq.samples.jms.spring.globals.utils;

import com.ibm.mq.samples.jms.spring.globals.Constants;
import com.ibm.mq.samples.jms.spring.globals.data.OurData;
import com.ibm.mq.samples.jms.spring.globals.data.OurOtherData;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import jakarta.jms.*;
import java.io.Serializable;
import java.util.Map;

public class MessageUtils {
    protected static final Log logger = LogFactory.getLog(MessageUtils.class);

    private MessageUtils () {}

    public static void checkMessageType(Message message) {
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

    public static void logHeaders(Map<String, Object> msgHeaders) {
        if (! msgHeaders.isEmpty() ) {
            logger.info("");
            logger.info("Headers found");
            msgHeaders.forEach((k, v) -> {
                logger.info(k + ": is of type" + v.getClass());
            });
        }
    }

    private static void checkForObject(ObjectMessage message) {
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

}
