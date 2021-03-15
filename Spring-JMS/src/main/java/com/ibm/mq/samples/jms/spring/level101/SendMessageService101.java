package com.ibm.mq.samples.jms.spring.level101;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;


@Service
public class SendMessageService101 {

    // This is a queue in put mode and a topic in pub mode
    @Value("${app.l101.dest.name1}")
    public String sendQueue;

    final private JmsTemplate jmsTemplate;

    SendMessageService101(JmsTemplate jmsTemplate) {
        this.jmsTemplate = jmsTemplate;
    }

    public void sendTextMsg(String msg) {
        jmsTemplate.send(sendQueue, s -> s.createTextMessage(msg));
    }

    public void send(String msg) {
        jmsTemplate.convertAndSend(sendQueue, msg);
    }

}



