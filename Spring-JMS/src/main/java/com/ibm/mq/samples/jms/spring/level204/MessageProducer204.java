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

package com.ibm.mq.samples.jms.spring.level204;

import com.ibm.mq.samples.jms.spring.globals.data.OurData;
import com.ibm.mq.samples.jms.spring.globals.handlers.OurDestinationResolver;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.integration.dsl.*;
import org.springframework.integration.jms.dsl.Jms;
import org.springframework.integration.support.MessageBuilder;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.stereotype.Component;

import jakarta.jms.ConnectionFactory;

//@Component
public class MessageProducer204 {
    protected final Log logger = LogFactory.getLog(getClass());

    @Autowired
    private ConnectionFactory connectionFactory;

    @Value("${app.l204.queue.name1}")
    public String sendQueue;

    public MessageChannel datainput = null;

    @Bean
    public IntegrationFlow myOurDataFlow() {
        return IntegrationFlows.from(MessageChannels.direct("ourdatainput"))
                .log()
                .transform(Transformers.toJson())
                .log()
                .<String>handle((payload, headers) -> {
                    logger.info("Transformed payload looks like : " + payload);
                    return payload;
                })
                .handle(String.class, (payload, headers) -> {
                    logger.info("Letting Spring take care of the conversion : " + payload);
                    return payload;
                })
                .handle(Jms.outboundAdapter(connectionFactory)
                            .destination(sendQueue)
                            .configureJmsTemplate(c -> c.destinationResolver(new OurDestinationResolver())))
                .get();
    }

    public void send(Message<OurData> builtMessage) {
        if (null != datainput) {
            datainput.send(builtMessage);
        } else {
            logger.warn("Not ready to send messages");
        }

    }


    @Bean
    CommandLineRunner process(MessageChannel ourdatainput) {
        return args -> {
            logger.info("Sending initial message");
            // Only way I could see of capturing the data input message channel
            // Tried to create it as a bean, but that didn't work.
            datainput = ourdatainput;
            datainput.send(MessageBuilder.withPayload(new OurData("Initializer")).build());
        };
    }

}
