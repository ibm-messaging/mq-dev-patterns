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
