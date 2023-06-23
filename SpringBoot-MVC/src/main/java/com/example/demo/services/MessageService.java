/**
 * Copyright 2022, 2023 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
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
 **/

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
