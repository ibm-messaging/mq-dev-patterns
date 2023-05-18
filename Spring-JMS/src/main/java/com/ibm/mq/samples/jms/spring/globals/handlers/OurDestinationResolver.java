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

package com.ibm.mq.samples.jms.spring.globals.handlers;

import com.ibm.mq.jakarta.jms.MQDestination;
import com.ibm.mq.samples.jms.spring.globals.Constants;
import com.ibm.msg.client.jakarta.wmq.WMQConstants;
import org.springframework.jms.support.destination.DestinationResolver;

import jakarta.jms.DeliveryMode;
import jakarta.jms.Destination;
import jakarta.jms.JMSException;
import jakarta.jms.Session;

public class OurDestinationResolver implements DestinationResolver {
    @Override
    public Destination resolveDestinationName(Session session, String dest, boolean pubSub) throws JMSException {
        Destination destination = null;

        if (pubSub) {
            destination = session.createTopic(dest);
        } else {
            destination = session.createQueue(dest);
        }

        MQDestination mqDestination = (MQDestination) destination;
        mqDestination.setTargetClient(WMQConstants.WMQ_CLIENT_NONJMS_MQ);

        if (dest.startsWith(Constants.TEMPQUEUEPREFIX)) {
            mqDestination.setPersistence(DeliveryMode.NON_PERSISTENT);
        }

        return destination;
    }
}
