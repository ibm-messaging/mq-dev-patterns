/*
 * (c) Copyright IBM Corporation 2021
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
package com.ibm.mq.samples.jms.spring.level115;

import com.ibm.mq.*;
import com.ibm.mq.samples.jms.spring.globals.properties.MQAdminProperties;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.ibm.mq.constants.CMQC;

import java.util.Hashtable;

@Configuration
public class MQConfiguration115 {
    protected final Log logger = LogFactory.getLog(getClass());

    private final MQAdminProperties adminProperties;

    @Value("${ibm.mq.queueManager:QM1}")
    public String qMgrName;

    public MQConfiguration115(MQAdminProperties adminProperties) {
        this.adminProperties = adminProperties;
    }

    @Bean
    public MQQueueManager mqQueueManager() {
        try {
            Hashtable<String,Object> connectionProperties = new Hashtable<String,Object>();

            connectionProperties.put(CMQC.CHANNEL_PROPERTY, adminProperties.getChannel());
            connectionProperties.put(CMQC.HOST_NAME_PROPERTY, adminProperties.getHost());
            connectionProperties.put(CMQC.PORT_PROPERTY, adminProperties.getPort());
            connectionProperties.put(CMQC.USER_ID_PROPERTY, adminProperties.getUser());
            connectionProperties.put(CMQC.PASSWORD_PROPERTY, adminProperties.getPassword());

            return new MQQueueManager(qMgrName, connectionProperties);

        } catch (MQException e) {
            logger.warn("MQException obtaining MQQueueManager");
            logger.warn(e.getMessage());
        }

        return null;
    }

}
