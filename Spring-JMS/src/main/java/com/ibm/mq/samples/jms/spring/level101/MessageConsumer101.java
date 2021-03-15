package com.ibm.mq.samples.jms.spring.level101;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

//@Component
public class MessageConsumer101 {
    protected final Log logger = LogFactory.getLog(getClass());

    @JmsListener(destination = "${app.l101.dest.name2}")
    public void receive(String message) {
        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info("Received message is: " + message);
    }
}
