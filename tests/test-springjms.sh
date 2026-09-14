#!/bin/bash

curdir=`pwd`
logFile=$curdir/logs/test-springjms.log

cd ../Spring-JMS

export JAVA_HOME=/usr/lib/jvm/java-21-temurin-jdk/

# These match the container image started by the main test driver
export IBM_MQ_CONNNAME="localhost(1413)"
export IBM_MQ_USER="app"
export IBM_MQ_PASSWORD="password"

# Uncomment this to get to see the active configuration
# export LOGGING_LEVEL_COM_IBM_MQ_SPRING_BOOT=TRACE

(
mvn clean package spring-boot:run 2>&1 &
pid=$!
sleep 45
kill $pid

) | tee $logFile

# A very simple check of progress
grep -q "ERROR" $logFile
if [ $? -eq 0 ]
then
  exit 1
else
  exit 0
fi
