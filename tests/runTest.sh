#!/bin/bash

# Execute basic verification tests for sets of samples within this repo

function printSyntax() {
    cat << EOF
Usage: runTest.sh [-c command] [-r] [-s] [-w]
Options:
    -c Container command ("docker" or "podman")  (default: $defaultCmd)
    -r Reset the container
    -s Shutdown the container if it's running, and exit
    -w Start the webserver
EOF
exit 1
}

function validTests() {
  cat << EOF

Valid tests are:
EOF

  ls test-* | sed "s/test\-//g;s/.sh//g"  | pr -o 2 -2 -t
  echo
  exit 1
}

defaultCmd=podman

cmd=$defaultCmd

resetContainer=false
shutdown=false
startWeb=false
args=""

while getopts :c:rsw o
do
  case $o in
  c)
    cmd=$OPTARG
    if [ "$cmd" != "docker" ] && [ $cmd != "podman" ]
    then
      printSyntax
    fi
    ;;
  r)
    resetContainer=true
    ;;
  s)
    shutdown=true
    resetContainer=true
    args="$args -s"
    ;;
  w)
    startWeb=true
    args="$args -w"
    ;;
  *)
    printSyntax
    ;;
  esac
done
shift $((OPTIND-1))

if $resetContainer
then
  ./runContainer.sh -c $cmd $args
  if $shutdown
  then
    exit 0
  fi
else
  cont=`$cmd ps | grep ibm-messaging | awk '{print $1}'`
  if [ -z "$cont" ]
  then
    ./runContainer.sh -c $cmd $args
  fi
  echo "Keeping existing container image running"
fi

# Now we can get going with the actual tests
curdir=`pwd`
rcFile=/tmp/rc

mkdir -p $curdir/logs 2>/dev/null

# This is a simplifed JSON file that has enough in it to connect to the container, without TLS.
# A couple of different env vars have been used to name it.
export CONFIG_JSON_FILE=$curdir/env_test.json
export JSON_CONFIG=$CONFIG_JSON_FILE

# Empty the queues that might be used.
export CMD_CONT=$cmd

. ./common
clearQ

# Select which test script to execute. The names roughly follow
# the directory name
if [ -z "$*" ]
then
  echo "No tests selected"
  validTests
fi

finalrc=0
for o in $*
do
  # Allow some variation in the testcase name
  ol=`echo $o | tr '[:upper:]' '[:lower:]' | sed "s/test\-//g" | sed "s/\.sh$//g" | sed "s/\-//g" `

  f="./test-$ol.sh"

  if [ ! -x $f ]
  then
    echo "Cannot find testcase: $ol"
    validTests
    exit 1
  fi

  echo "Running test $o"
  logFile=$curdir/logs/full-$ol.log
  ($f 2>&1; echo $? > $rcFile) | tee $logFile
  rc=`cat $rcFile`

  # Make this line distinctive so we can find it in any captured output
  echo ">> Return code for test $o: $rc"
  if [ $rc -ne 0 ]
  then
    finalrc=$rc
  fi
done
exit $finalrc

#################
# Directories that have code but do not currently have tests
#   amqp
#   amqp-qpid
#   container
#   dotnet
#   Go-K8s
#   ibm-messaging-mq-cloud-showcase-app
#   JMS
#   Node.js-OTel
#   OpenLiberty-MDB
#   reactive-amqp
#   reactjs
#   Rust-REST
#   serverless
#   Swift-REST
