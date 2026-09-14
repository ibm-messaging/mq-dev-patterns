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
logFile=$curdir/logs/testpython.log

venv=$curdir/venv
if [ ! -d $venv ]
then
  python -m venv venv
  if [ $? -ne 0 ]
  then
    echo "ERROR: Cannot create Python virtual env at $venv"
    exit 1
  fi
fi

. $venv/bin/activate
if [ $? -ne 0 ]
then
  echo "ERROR: Cannot activate Python virtual env at $venv"
  exit 1
fi

# Install the latest ibmmq package
pip uninstall -y ibmmq 2>/dev/null
pip install --upgrade pip >/dev/null 2>&1
pip install ibmmq

# Can now get round to running the tests

cd ../Python

(

pip show ibmmq 2>&1 | head -2 # Display the active version

python basicput.py
checkRc $? "PUT"
python basicget.py
checkRc $? "GET"

(python basicsubscribe.py; echo $? > /tmp/rc) &
pid=$!
sleep 1
python basicpublish.py
checkRc $? "PUB"
wait $pid
checkRc `cat /tmp/rc` "SUB"

(python basicresponse.py; echo $? > /tmp/rc) &
pid=$!
sleep 1
python basicrequest.py
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
