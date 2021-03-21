package com.ibm.mq.samples.jms.spring.level201;

import com.ibm.mq.samples.jms.spring.globals.data.OurData;
import com.ibm.mq.samples.jms.spring.globals.handlers.OurDestinationResolver;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.integration.dsl.IntegrationFlow;
import org.springframework.integration.dsl.IntegrationFlows;
import org.springframework.integration.dsl.Pollers;
import org.springframework.integration.dsl.Transformers;
import org.springframework.integration.jms.dsl.Jms;
import org.springframework.stereotype.Component;

import javax.jms.ConnectionFactory;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

// @Component
public class MessageProducer201 {
    protected final Log logger = LogFactory.getLog(getClass());

    @Autowired
    private ConnectionFactory connectionFactory;

    @Value("${app.l201.queue.name1}")
    public String sendQueue;

    static private int currPosition = 0;
    static private String greetings[] = {"Hello", "Hi", "Good day", "Welcome"};

    private Supplier<OurData> dataSource = new Supplier<OurData> () {
        @Override
        public OurData get() {
            if (currPosition >= greetings.length) {
                currPosition = 0;
            }
            OurData nxtData = new OurData(greetings[currPosition]);
            currPosition++;
            return nxtData;
        }
    };

    @Bean
    public IntegrationFlow myOurDataFlow() {
        return IntegrationFlows.fromSupplier(dataSource, e -> e.poller(Pollers.fixedRate(120, TimeUnit.SECONDS, 60)))
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

}
