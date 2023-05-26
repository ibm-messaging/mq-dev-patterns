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

package com.ibm.mq.samples.jms.spring.level114;

import com.ibm.mq.jakarta.jms.MQConnectionFactory;
import com.ibm.mq.samples.jms.spring.globals.handlers.OurDestinationResolver;
import com.ibm.mq.samples.jms.spring.globals.handlers.OurMessageConverter;
import com.ibm.mq.spring.boot.MQConfigurationProperties;
import com.ibm.mq.spring.boot.MQConnectionFactoryFactory;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jms.config.DefaultJmsListenerContainerFactory;
import org.springframework.jms.config.JmsListenerContainerFactory;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.jms.support.QosSettings;


import jakarta.jms.DeliveryMode;
import jakarta.jms.JMSException;

//@Configuration
public class MQConfiguration114 {
    protected final Log logger = LogFactory.getLog(getClass());

    @Bean
    public MQConnectionFactory mqConnectionFactory() throws JMSException {
        MQConfigurationProperties properties = new MQConfigurationProperties();
        // Properties will be a mix of defaults, and those found in application.properties
        // under ibm.mq
        // Here we can override any of the properties should we need to
        MQConnectionFactoryFactory mqcff = new MQConnectionFactoryFactory(properties,null);
        MQConnectionFactory mqcf = mqcff.createConnectionFactory(MQConnectionFactory.class);
        return mqcf;
    }

    @Bean
    public JmsListenerContainerFactory<?> myContainerFactory114() throws JMSException {
        DefaultJmsListenerContainerFactory factory = new DefaultJmsListenerContainerFactory();
        factory.setConnectionFactory(mqConnectionFactory());
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

    @Bean("myNonJmsTemplate114")
    public JmsTemplate myNonJmsTemplate114() throws JMSException {
        JmsTemplate jmsTemplate = new JmsTemplate(mqConnectionFactory());
        jmsTemplate.setDestinationResolver(new OurDestinationResolver());
        jmsTemplate.setMessageConverter(new OurMessageConverter());

        return jmsTemplate;
    }

}
