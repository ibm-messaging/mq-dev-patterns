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

package com.ibm.mq.samples.jms.spring.level113;

import com.ibm.mq.samples.jms.spring.globals.Constants;
import com.ibm.mq.samples.jms.spring.globals.handlers.OurDestinationResolver;
import com.ibm.mq.samples.jms.spring.globals.handlers.OurMessageConverter;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.jms.annotation.JmsListenerConfigurer;
import org.springframework.jms.config.DefaultJmsListenerContainerFactory;
import org.springframework.jms.config.JmsListenerContainerFactory;
import org.springframework.jms.config.JmsListenerEndpointRegistrar;
import org.springframework.jms.config.SimpleJmsListenerEndpoint;
import org.springframework.jms.support.QosSettings;

import jakarta.jms.ConnectionFactory;
import jakarta.jms.DeliveryMode;

//@Configuration
public class MQConfiguration113 implements JmsListenerConfigurer {
    protected final Log logger = LogFactory.getLog(getClass());

    @Autowired
    private ConnectionFactory connectionFactory;

    @Value("${app.l113.queue.name2}")
    public String receiveQueue;

    @Override
    public void configureJmsListeners(JmsListenerEndpointRegistrar registrar) {

        registrar.setContainerFactory(containerFactory113());
        SimpleJmsListenerEndpoint endpoint = new SimpleJmsListenerEndpoint();
        endpoint.setId("JmsEndpoint113");
        endpoint.setDestination(receiveQueue);
        endpoint.setMessageListener(message -> {
            logger.info("");
            logger.info( this.getClass().getSimpleName());
            logger.info("Received message of type: " + message.getClass().getSimpleName());
            logger.info("Received message :" + message);
        });
        registrar.registerEndpoint(endpoint);
    }

    @Bean
    public JmsListenerContainerFactory<?> containerFactory113() {
        DefaultJmsListenerContainerFactory factory = new DefaultJmsListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);

        factory.setDestinationResolver(new OurDestinationResolver());
        factory.setPubSubDomain(false);
        factory.setMessageConverter(new OurMessageConverter());

        // reply Qos
        QosSettings rQos = new QosSettings();
        rQos.setPriority(3);
        rQos.setTimeToLive(10 * Constants.MINUTE);
        rQos.setDeliveryMode(DeliveryMode.NON_PERSISTENT);
        factory.setReplyQosSettings(rQos);
        return factory;
    }

}
