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
if [ ! -d "$venv" ]
then
  python -m venv "$venv"
  if [ $? -ne 0 ]
  then
    echo "ERROR: Cannot create Python virtual env at $venv"
    exit 1
  fi
fi

# Activate venv — path differs between Unix and Windows (Git Bash)
if [ -f "$venv/bin/activate" ]
then
  activate_script="$venv/bin/activate"
elif [ -f "$venv/Scripts/activate" ]
then
  activate_script="$venv/Scripts/activate"
else
  echo "ERROR: Cannot find activate script in $venv"
  exit 1
fi

. "$activate_script"
if [ $? -ne 0 ]
then
  echo "ERROR: Cannot activate Python virtual env at $venv"
  exit 1
fi

# Install the latest ibmmq package
pip uninstall -y ibmmq 2>/dev/null
pip install --upgrade pip >/dev/null 2>&1
pip install ibmmq
if [ $? -ne 0 ]
then
  echo "ERROR: Cannot install ibmmq package"
  exit 1
fi

# Can now get round to running the tests

cd ../Python

(

pip show ibmmq 2>&1 | head -2 # Display the active version

python basicput.py
checkRc $? "PUT"
python basicget.py
checkRc $? "GET"

rc_file=$(mktemp)
(python basicsubscribe.py; echo $? > "$rc_file") &
pid=$!
sleep 1
python basicpublish.py
checkRc $? "PUB"
wait $pid
checkRc $(cat "$rc_file") "SUB"
rm -f "$rc_file"

rc_file=$(mktemp)
(python basicresponse.py; echo $? > "$rc_file") &
pid=$!
sleep 1
python basicrequest.py
checkRc $? "REQ"
wait $pid
checkRc $(cat "$rc_file") "RES"
rm -f "$rc_file"

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