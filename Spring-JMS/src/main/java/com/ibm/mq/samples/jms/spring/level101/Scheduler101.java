package com.ibm.mq.samples.jms.spring.level101;

import com.ibm.mq.samples.jms.spring.globals.Constants;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

//@Component
@EnableScheduling
public class Scheduler101 {
    protected final Log logger = LogFactory.getLog(getClass());

    private final SendMessageService101 service;
    static private int i = 0;

    Scheduler101(SendMessageService101 service) {
        this.service = service;
    }

    @Scheduled(initialDelay = 30 * Constants.SECOND, fixedRate = 2 * Constants.MINUTE)
    public void run() {
        String msg = "Sending messages in cycle :" + i++;

        logger.info("");
        logger.info( this.getClass().getSimpleName());

        logger.info(msg + " as template converted");
        service.send(msg);

        logger.info(msg + " as explicit text message");
        service.sendTextMsg(msg);
    }


}

/*
@Component
@EnableScheduling
public class ScheduledMessageSender {

    protected final Log logger = LogFactory.getLog(getClass());
    private final SendMessageService service;
    static private int i = 0;

    ScheduledMessageSender(SendMessageService sendMessageService) {
        this.service = sendMessageService;
    }

    @Scheduled(initialDelay = 2000, fixedRate = 10000)
    public void run() {
        String msg = "Sending message :" + i++;
        logger.info(msg);
        service.send(msg);
    }
}

 */
