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

package com.ibm.mq.samples.jms.spring.level203;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.integration.channel.BroadcastCapableChannel;
import org.springframework.integration.dsl.IntegrationFlow;
import org.springframework.integration.dsl.IntegrationFlows;
import org.springframework.integration.dsl.Pollers;
import org.springframework.integration.jms.dsl.Jms;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

import jakarta.jms.ConnectionFactory;
import java.util.concurrent.TimeUnit;


//@Component
public class MessageConsumer203 {
    protected final Log logger = LogFactory.getLog(getClass());

    @Autowired
    private ConnectionFactory connectionFactory;

    @Value("${app.l203.topic.name2}")
    public String inTopic;

    @Bean
    public BroadcastCapableChannel jmsSubscribeChannel() {
        return Jms.publishSubscribeChannel(connectionFactory)
                .destination(inTopic)
                .get();
    }


    @Bean
    public IntegrationFlow subFlow(BroadcastCapableChannel jmsSubscribeChannel) {
        return f -> f
                .publishSubscribeChannel(jmsSubscribeChannel,
                        pubsub -> pubsub
                                .subscribe(subFlow -> subFlow
                                        .channel(c -> c.queue("jmsPubToSubBridgeChannel1")))
                                .subscribe(subFlow -> subFlow
                                        .channel(c -> c.queue("jmsPubToSubBridgeChannel2"))))
                .log()
                .handle(String.class, (payload, headers) -> {
                    logger.info("In main subFlow payload is : " + payload);
                    return payload;
                })
                .handle(System.out::println);
    }

    @Bean
    public IntegrationFlow msgHandler1() {
        return IntegrationFlows.from("jmsPubToSubBridgeChannel1")
                .bridge(e -> e.poller(Pollers.fixedRate(1, TimeUnit.SECONDS, 20)))
                .log()
                .filter(Message.class, m -> { logger.info(" ch1 : Message Type is : " + m.getClass().getName()); return true; })
                .<String, String>transform(s -> "processed message in ch1 " + s)
                .handle(System.out::println)
                .get();

    }

    @Bean
    public IntegrationFlow msgHandler2() {
        return IntegrationFlows.from("jmsPubToSubBridgeChannel2")
                .bridge(e -> e.poller(Pollers.fixedRate(1, TimeUnit.SECONDS, 20)))
                .log()
                .filter(Message.class, m -> { logger.info(" ch2 : Message Type is : " + m.getClass().getName()); return true; })
                .<String, String>transform(s -> "processed message in ch2 " + s)
                .handle(System.out::println)
                .get();
    }


}
