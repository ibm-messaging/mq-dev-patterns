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

package com.ibm.mq.samples.jms.spring.level108;

import com.ibm.mq.samples.jms.spring.globals.handlers.OurDestinationResolver;
import com.ibm.mq.samples.jms.spring.globals.handlers.OurMessageConverter;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jms.config.DefaultJmsListenerContainerFactory;
import org.springframework.jms.config.JmsListenerContainerFactory;
import org.springframework.jms.support.QosSettings;

import jakarta.jms.ConnectionFactory;
import jakarta.jms.DeliveryMode;

@Configuration
public class MQConfiguration108 {
    protected final Log logger = LogFactory.getLog(getClass());

    @Autowired
    private ConnectionFactory connectionFactory;


    @Bean
    public JmsListenerContainerFactory<?> myContainerFactory108() {
        DefaultJmsListenerContainerFactory factory = new DefaultJmsListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setPubSubDomain(false);

        factory.setMessageConverter(new OurMessageConverter());
        factory.setDestinationResolver(new OurDestinationResolver());

        // reply Qos
        QosSettings rQos = new QosSettings();
        rQos.setPriority(2);
        rQos.setTimeToLive(10000);
        rQos.setDeliveryMode(DeliveryMode.NON_PERSISTENT);
        factory.setReplyQosSettings(rQos);

        return factory;
    }

}
