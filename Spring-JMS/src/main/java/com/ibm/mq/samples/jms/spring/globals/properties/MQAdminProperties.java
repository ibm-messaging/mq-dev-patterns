package com.ibm.mq.samples.jms.spring.globals.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties("my.app.admin")
@Data
public class MQAdminProperties {
    private String channel;
    private String host;
    private int port;
    private String user;
    private String password;
}
