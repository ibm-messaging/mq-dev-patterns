#!/bin/bash

. ./common

curdir=`pwd`
logFile=$curdir/logs/test-transpring.log

export JAVA_HOME=/usr/lib/jvm/java-21-temurin-jdk/
java=$JAVA_HOME/bin/java

# These match the container image started by the main test driver
export IBM_MQ_CONNNAME="localhost(1413)"
export IBM_MQ_USER="app"
export IBM_MQ_PASSWORD="password"

# Uncomment this to get to see the active configuration
# export LOGGING_LEVEL_COM_IBM_MQ_SPRING_BOOT=TRACE

(

clearQ

cd $curdir/../transactions/JMS/Spring/simple
mvn clean package dependency:copy-dependencies
$java -cp "target/classes/:target/dependency/*" com.ibm.mq.samples.jms.Application
rm -f mqjms.log*
clearQ

cd $curdir/../transactions/JMS/Spring/request-response
mvn clean package dependency:copy-dependencies
$java -cp "target/classes/:target/dependency/*" com.ibm.mq.samples.jms.Requester
rm -f mqjms.log*
clearQ

) 2>&1 | tee $logFile

# A very simple check of progress
grep -q "ERROR" $logFile
if [ $? -eq 0 ]
then
  exit 1
else
  exit 0
fi
