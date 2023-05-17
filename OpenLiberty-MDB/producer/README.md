To run this JMS producer:

 1. Set values for your queues and queue manager in env.json
 2. From the ~/producer folder:
 - mvn clean package
 3. java -cp target/mq-dev-patterns-0.1.0.jar: com.ibm.mq.samples.jms.JmsPut
