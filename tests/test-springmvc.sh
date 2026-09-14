#!/bin/bash

. common

curdir=`pwd`
logFile=$curdir/logs/test-springmvc.log

cd ../SpringBoot-MVC

# Get rid of any dangling executions
ps -ef|grep demo.DemoApplication | grep -v grep | awk '{print $2}' | xargs kill 2>/dev/null

mvn=/usr/bin/mvn

# A newer version than current version of Fedora has picked up.
# Resolves problem with using Java 25 deprecated methods.
# mvn=/opt/maven/apache-maven-3.9.16/bin/mvn

$mvn clean package
if [ $? -ne 0 ]
then
  exit 1
fi

# These match the container image started by the main test driver
export IBM_MQ_CONNNAME="localhost(1413)"
export IBM_MQ_USER="app"
export IBM_MQ_PASSWORD="password"
# Also override the application.properties
export SERVER_PORT=8090

$mvn spring-boot:run &
pid=$!

# Give it a chance to get running
sleep 10
# The port number matches what's in application.properties
# We're simply going to check that we can connect to the webserver. This will print
# the contents of index.html
curl localhost:$SERVER_PORT  2>&1 | tee $logFile
rc=$?

kill $pid
echo

rm -rf mqjms.log* FFDC
if [ $rc -ne 0 ]
then
  exit 1
fi

exit 0