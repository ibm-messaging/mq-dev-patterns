These JMS samples are used for the IBM ZXplore challenges.

They still use the JMS 2 APIs, not the now-recommended Jakarta.

It is assumed you have already installed the MQ Java client packag. Change the `/opt/mqm/java/lib` in the following
commands to point at wherever you have installed that package.

Building the samples can be done with:

```
javac -cp /opt/mqm/java/lib/com.ibm.mq.allclient.jar:/opt/mqm/java/lib/jms.jar \
  com/ibm/mq/samples/jms/*.java
```

You can then execute the individual programs. You may also need to set `LD_LIBRARY_PATH` or equivalent in order to use a
local queue manager instead of a client connection.

For example,

```
java -cp /opt/mqm/java/lib/com.ibm.mq.allclient.jar:/opt/mqm/java/lib/jms.jar:. \
  com.ibm.mq.samples.jms.JmsGet
```

