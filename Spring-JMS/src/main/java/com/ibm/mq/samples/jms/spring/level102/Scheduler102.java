package com.ibm.mq.samples.jms.spring.level102;

import com.ibm.mq.samples.jms.spring.globals.Constants;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

//@Component
@EnableScheduling
public class Scheduler102 {
    protected final Log logger = LogFactory.getLog(getClass());

    private final SendMessageService102 service;
    static private int i = 0;

    Scheduler102(SendMessageService102 service) {
        this.service = service;
    }

    @Scheduled(initialDelay = 20 * Constants.SECOND, fixedRate = 2 * Constants.MINUTE)
    public void run() {
        String msg = "Sending messages in cycle :" + i++;

        logger.info("");
        logger.info( this.getClass().getSimpleName());
        logger.info(msg);
        logger.info("Performing put");
        service.put(msg);
        logger.info("Performing publish");
        service.publish(msg);
    }
}
