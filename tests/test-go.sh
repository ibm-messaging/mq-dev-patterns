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
logFile=$curdir/logs/test-go.log

cd ../Go/src

(
go run basicput.go
checkRc $? "PUT"
go run basicget.go
checkRc $? "GET"

(go run basicsub.go; echo $? > /tmp/rc) &
pid=$!
sleep 1
go run basicpub.go
checkRc $? "PUB"
wait $pid
checkRc `cat /tmp/rc` "SUB"

(go run basicresponse.go; echo $? > /tmp/rc) &
pid=$!
sleep 1
go run basicrequest.go
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
exit 0
