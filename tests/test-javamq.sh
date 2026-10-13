#!/bin/bash

# (c) Copyright IBM Corporation 2026
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

. ./common

curdir=`pwd`
logFile=$curdir/logs/test-javamq.log

export EnvFile=$JSON_CONFIG

cd ../Java-MQ

mvn=/usr/bin/mvn

$mvn clean package -DskipTests
if [ $? -ne 0 ]
then
  echo "ERROR: Maven build failed"
  exit 1
fi
echo
echo "Target successfully built."

jar=target/base-mq-java-1.0.0.jar
pkg=com.ibm.mq.samples.java

# SampleEnvSetter reads env.json from the current working directory,
# so all java invocations are run from within the Java-MQ directory.
j="java -cp $jar $pkg"

(
clearQ

if true
then
$j.BasicPut 5
checkRc $? "PUT"
$j.BasicGet 10
checkRc $? "GET"
fi

if true
then
($j.BasicSub; echo $? > /tmp/rc) &
pid=$!
sleep 2
$j.BasicPub
checkRc $? "PUB"
wait $pid
checkRc `cat /tmp/rc` "SUB"
fi

if true
then
($j.BasicResponse; echo $? > /tmp/rc) &
pid=$!
sleep 1
$j.BasicRequest
checkRc $? "REQ"
wait $pid
checkRc `cat /tmp/rc` "RES"
fi
) 2>&1 | tee $logFile

cnt=`grep "ended OK" $logFile | wc -l`

# Trace/Log files might have been created
rm -f mqjms*

# We should have successfully run 6 tests
expect=6
if [ $cnt -ne $expect ]
then
  echo "ERROR: Got $cnt successes, not the expected $expect"
  exit 1
fi

exit 0
