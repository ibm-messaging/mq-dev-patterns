#!/bin/bash

function checkRc {
    rc=$1
    p="$2"
    if [ $rc -ne 0 ]
    then
      echo "ERROR: $p ended with rc: $rc"
      exit 1
    else
      echo "DONE : $p ended OK"
    fi
}

. ./common

curdir=`pwd`
logFile=$curdir/logs/test-jms.log
export EnvFile=$JSON_CONFIG
export LOGLEVEL=INFO

cd ../JMS

mvn=/usr/bin/mvn

# Don't attempt to run the unittests
$mvn -DargLine="-DEnvFile=$EnvFile -DRepoRoot=$curdir/.." clean package  -DskipTests
if [ $? -ne 0 ]
then
  echo "ERROR: Maven build failed"
  exit 1
fi
echo
echo "Target successfully built."
jar=target/mq-dev-patterns-jakarta-0.1.0.jar
# This class can select the specific operation to invoke from the same entrypoint
j="java -DEnvFile=$EnvFile -DRepoRoot=$curdir/.. -cp $jar com.ibm.mq.samples.jms.BasicSampleDriver"
(
clearQ

$j put
checkRc $? "PUT"
$j get
checkRc $? "GET"

($j sub; echo $? > /tmp/rc) &
pid=$!
sleep 2
$j pub
checkRc $? "PUB"
wait $pid
checkRc `cat /tmp/rc` "SUB"

($j rsp; echo $? > /tmp/rc) &
pid=$!
sleep 1
$j request
checkRc $? "REQ"
wait $pid
checkRc `cat /tmp/rc` "RES"

) 2>&1 | tee $logFile

cnt=`grep "ended OK" $logFile | wc -l `

# We should have successfully run 6 tests
expect=6
if [ $cnt -ne $expect ]
then
  echo "ERROR: Got $cnt successes, not the expected $expect"
  exit 1
fi

rm -rf mqjms.log* FFDC
exit 0
