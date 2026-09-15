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

# Require uv — install it if absent (curl pipe to sh is the official installer)
if ! command -v uv &>/dev/null; then
  echo "INFO : uv not found, installing..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi

cd ../Python

# Sync the venv from pyproject.toml + uv.lock (creates .venv if needed,
# upgrades ibmmq to the latest matching version, removes stale packages).
uv sync --upgrade
if [ $? -ne 0 ]
then
  echo "ERROR: uv sync failed"
  exit 1
fi

(

uv run pip show ibmmq 2>&1 | head -2 # Display the active version

uv run basicput
checkRc $? "PUT"
uv run basicget
checkRc $? "GET"

(uv run basicsubscribe; echo $? > /tmp/rc) &
pid=$!
sleep 1
uv run basicpublish
checkRc $? "PUB"
wait $pid
checkRc `cat /tmp/rc` "SUB"

(uv run basicresponse; echo $? > /tmp/rc) &
pid=$!
sleep 1
uv run basicrequest
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
