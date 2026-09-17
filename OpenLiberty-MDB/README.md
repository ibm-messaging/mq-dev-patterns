## Instructions

This directory contains the code referenced in [this
tutorial](https://developer.ibm.com/tutorials/mq-reactive-messaging-with-open-liberty-jms-jakarta/)

Assuming you know how all this works, and just need the commands, the steps are

In one window
```
   cd jms-2-mdb
   mvn liberty:dev
```
or
```
   cd jakarta-3-mdb
   mvn liberty:dev
```

In another window
```
  cd producer
  mvn clean package
  java -cp target/ibm-mq-liberty-producer-0.1.0.jar: com.ibm.mq.samples.jms.JmsPut
```

## Configuration
Configuration is in producer/env.json and the _*mdb/src/main/liberty/config/server.xml_ files. All these need to match
for the queue manager connection and the queues to be used.

## Output
Output from the Liberty server is sent to stdout. If you don't see INFO-level logging, then perhaps you have overridden
the default log level somewhere in your environment.

Maybe setting `MAVEN_SKIP_RC=1` will help.
