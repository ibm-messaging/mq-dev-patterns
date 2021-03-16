package com.ibm.mq.samples.jms.spring.level106;

import com.ibm.mq.jms.MQDestination;
import com.ibm.msg.client.wmq.WMQConstants;
import org.springframework.jms.support.destination.DestinationResolver;

import javax.jms.Destination;
import javax.jms.JMSException;
import javax.jms.Session;

public class DestinationResolver106 implements DestinationResolver {
    @Override
    public Destination resolveDestinationName(Session session, String dest, boolean pubSub) throws JMSException {
        Destination destination = null;

        if (pubSub) {
            destination = session.createTopic(dest);
        } else {
            destination = session.createQueue(dest);
        }

        MQDestination mqDestination = (MQDestination) destination;
        mqDestination.setTargetClient(WMQConstants.WMQ_CLIENT_NONJMS_MQ);

        return destination;
    }
}

