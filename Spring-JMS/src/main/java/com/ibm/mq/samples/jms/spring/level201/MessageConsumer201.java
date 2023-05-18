/*
 * (c) Copyright IBM Corporation 2021, 2023
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
 */

package com.ibm.mq.samples.jms.spring.level201;

import com.ibm.mq.samples.jms.spring.globals.Constants;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.integration.dsl.IntegrationFlow;
import org.springframework.integration.dsl.IntegrationFlows;
import org.springframework.integration.dsl.Pollers;
import org.springframework.integration.jms.dsl.Jms;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

import jakarta.jms.ConnectionFactory;


//@Component
public class MessageConsumer201 {
    protected final Log logger = LogFactory.getLog(getClass());

    @Autowired
    private ConnectionFactory connectionFactory;

    @Value("${app.l201.queue.name2}")
    public String inQueue;

    @Bean
    public IntegrationFlow mqInMessageFlow() {
        return IntegrationFlows
                .from(Jms.inboundAdapter(connectionFactory)
                                .destination(inQueue)
                                .configureJmsTemplate(template -> template.receiveTimeout(-1))
                        , configurer -> configurer.poller(Pollers.fixedDelay(1 * Constants.SECOND))
                )
                .filter(Message.class, m -> {
                    logger.info(" Message Type is : " + m.getClass().getName());
                    return true; })
                .<String, String>transform(s -> "processed message " + s)
                .handle((s,messageHeaders) -> {
                    logger.info("Have received message : " + s);
                    return null;})
                .get();
    }

}
