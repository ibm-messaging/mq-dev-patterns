package com.example.demo.services;

import org.springframework.jms.JmsException;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

@Service
public class MessageService {

	private final JmsTemplate jmsTemplate;
	
	@Value("${ibm.mq.queue}")
	private String queue;

	public MessageService(JmsTemplate jmsTemplate) {
		this.jmsTemplate = jmsTemplate;
	}

	public String send(String message) {				
		try {						
			jmsTemplate.convertAndSend(queue, message);						
			return "{ \"message\" : \"Message Sent: "  + message +"\" }";
		} catch (JmsException ex) {
			ex.printStackTrace();
			return "{ \"message\" : \"Some errors occured on sending the message: "+ message+ "\" }";			
		}
	}

	public String recv() {
		try {
			String msg = jmsTemplate.receiveAndConvert(queue).toString();
			return "{ \"message\" : \"Message Received: "  + msg + "\" }";
		} catch (JmsException ex) {
			ex.printStackTrace();
			return "{ \"message\" : \"Error on receiving the message\" }";
		}
	}
}
