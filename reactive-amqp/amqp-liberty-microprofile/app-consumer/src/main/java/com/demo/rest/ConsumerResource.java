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