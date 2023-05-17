/*
* (c) Copyright IBM Corporation 2023
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

package com.demo.rest;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import org.eclipse.microprofile.reactive.messaging.Outgoing;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import io.smallrye.reactive.messaging.amqp.AmqpMessage;
import org.eclipse.microprofile.reactive.messaging.Channel;
import org.eclipse.microprofile.reactive.messaging.Emitter;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.concurrent.CompletionStage;
import jakarta.inject.Inject;

@ApplicationScoped
public class ConsumerResource {
    
    @Inject
    @Channel("data-out") 
    Emitter<String> quoteRequestEmitter;

    @GET    
    public String getResource() {                
        quoteRequestEmitter.send("This is a message from the producer"); 
        return "Message sent";
    }

    @Incoming("data-in")
    public  CompletionStage<Void> consume(AmqpMessage<String> message) {
        System.out.println("received (my-topic): " + message.getPayload() + " from queue " + message.getAddress());        
        CompletionStage<Void> ack = message.ack();
        quoteRequestEmitter.send("This is a message from the consumer"); 
        return ack;
    }    

}