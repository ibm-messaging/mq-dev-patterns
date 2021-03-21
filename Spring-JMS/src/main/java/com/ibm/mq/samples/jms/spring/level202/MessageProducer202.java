package com.ibm.mq.samples.jms.spring.level202;

import com.ibm.mq.samples.jms.spring.globals.Constants;
import com.ibm.mq.samples.jms.spring.globals.data.DataSource;
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

@Component
public class MessageProducer202 {
    protected final Log logger = LogFactory.getLog(getClass());

    @Autowired
    private ConnectionFactory connectionFactory;

    @Value("${app.l202.queue.name1}")
    public String sendQueue;

    @Value("${app.l202.queue.name3}")
    public String replyQueue;


    @Bean
    public IntegrationFlow myOurDataFlow() {
        return IntegrationFlows.fromSupplier(new DataSource(), e -> e.poller(Pollers.fixedRate(120, TimeUnit.SECONDS, 60)))
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
                .handle(Jms.outboundGateway(this.connectionFactory)
                        .requestDestination(sendQueue)
                        .replyDestination(replyQueue)
                        .destinationResolver(new OurDestinationResolver())
                        .receiveTimeout(5 * Constants.SECOND))
                .handle(System.out::println)
                .get();
    }

}
