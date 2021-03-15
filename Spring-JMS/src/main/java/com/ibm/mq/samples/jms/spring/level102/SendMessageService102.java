package com.ibm.mq.samples.jms.spring.level102;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;


@Service
public class SendMessageService102 {

    @Value("${app.l102.queue.name1}")
    public String sendQueue;

    @Value("${app.l102.topic.name1}")
    public String sendTopic;

    final private JmsTemplate myPutGetTemplate;
    final private JmsTemplate myPubSubTemplate;

    SendMessageService102(JmsTemplate myPutGetTemplate, JmsTemplate myPubSubTemplate) {
        this.myPutGetTemplate = myPutGetTemplate;
        this.myPubSubTemplate = myPubSubTemplate;
    }

    public void put(String msg) {
        myPutGetTemplate.convertAndSend(sendQueue, msg);
    }
    public void publish(String msg) {
        myPubSubTemplate.convertAndSend(sendTopic, msg);
    }

}



