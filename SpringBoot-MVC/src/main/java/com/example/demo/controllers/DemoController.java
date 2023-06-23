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

package com.example.demo.controllers;

import com.example.demo.services.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DemoController {

	private final MessageService messageService;
	@Value("${ibm.mq.connName}")
    private String connName;

	@Autowired
	public DemoController(MessageService messageService) {
		this.messageService = messageService;
	}

	@GetMapping("send")
	public String send(@RequestParam("msg") String msg) {
		return messageService.send(msg);
	}

	@GetMapping("recv")
	public String recv() {
		return messageService.recv();
	}

	@GetMapping("address")
	public String address() {
		try {
			String address_ = connName.split("\\(")[0];;			
			return "{ \"message\" : \""+ address_ +"\",  \"message\" : \""+ address_ +"\" }";
		} catch(Exception e) {
			return "{ \"message\" : \"Please ensure that your application.properties file is set up correctly.\" }";
		}
		
	}
}
