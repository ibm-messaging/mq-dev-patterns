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

curdir=`pwd`
logFile=$curdir/logs/test-c.log

cd ../C


make clean all
if [ $? -ne 0 ]
then
  echo "Make failed"
  exit 1
fi

export DEBUG=true
(
./sampleput
checkRc $? "PUT"
sampleget
checkRc $? "GET"

(samplesubscribe; echo $? > /tmp/rc) &
pid=$!
sleep 1
samplepublish
checkRc $? "PUB"
wait $pid
checkRc `cat /tmp/rc` "SUB"

(sampleresponse; echo $? > /tmp/rc) &
pid=$!
sleep 1
samplerequest
checkRc $? "REQ"
wait $pid
checkRc `cat /tmp/rc` "RES"

) 2>&1 | tee $logFile
cnt=`grep "ended OK" $logFile | wc -l `

# We should have successfully run 6 tests
expect=6
if [ $cnt -ne $expect ]
then
  echo "ERROR: Did not get $expect successes"
  exit 1
fi
exit 0
