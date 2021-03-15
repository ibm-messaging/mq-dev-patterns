package com.ibm.mq.samples.jms.spring.level102;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

//@Component
public class MessageConsumer102 {
    protected final Log logger = LogFactory.getLog(getClass());

    @JmsListener(destination = "${app.l102.queue.name2}", containerFactory = "myGetContainerFactory102", id="queueGet102")
    public void receiveFromQueue(String message) {
        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info("Received message from queue is : " + message);
    }

    @JmsListener(destination = "${app.l102.topic.name2}", containerFactory = "mySubContainerFactory102", id="topicSub102")
    public void receiveFromTopic(String message) {
        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info("Received message from topic is: " + message);
    }
}
