#!/bin/bash

# This test only exercises the "sample*" programs, not the "basic*" which should
# perhaps be deleted.

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
logFile=$curdir/logs/test-nodejs.log

cd ../Node.js
#rm -rf node_modules
npm install

npm audit
if [ $? -ne 0 ]
then
  echo "ERROR: trying to install vulnerable dependencies"
  # exit 1
fi

export EnvFile=$JSON_CONFIG
export DEBUG="*:*"

(
node sampleput.js
checkRc $? "PUT"
node sampleget.js
checkRc $? "GET"

(node samplesubscribe.js; echo $? > /tmp/rc) &
pid=$!
sleep 1
node samplepublish.js
checkRc $? "PUB"
wait $pid
checkRc `cat /tmp/rc` "SUB"

(node sampleresponse.js; echo $? > /tmp/rc) &
pid=$!
sleep 1
node samplerequest.js
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
