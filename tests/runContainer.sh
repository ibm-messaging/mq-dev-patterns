#!/bin/bash

# This script gets the latest version of MQ running in a local container.
# The "developer" configuration is used, which gives us queues such as DEV.QUEUE.1

function printSyntax() {
    cat << EOF
Usage: runContainer.sh [-c command] [-e] [-p publicPort] [-s] [-t tag] [-w]
Options:
    -c Container command ("docker" or "podman")  (default: $defaultCmd)
    -e Start from an empty container
    -p Public port (default: $defaultPublicPort)
    -s Shutdown the container if it's running
    -t Image tag (default: $defaultTag)
    -w Start the webserver
EOF
exit 1
}

n="ibm-messaging/mq"

defaultTag="latest"
defaultPublicPort=1413
defaultCmd="podman"
defaultEmpty=false

publicPort=$defaultPublicPort
cmd=$defaultCmd
empty=$defaultEmpty
tag=$defaultTag
volume="varmqmpy"

shutdown=false
startWeb=false

while getopts :c:ep:st:w o
do
  case $o in
  c)
    cmd=$OPTARG
    if [ "$cmd" != "docker" ] && [ $cmd != "podman" ]
    then
      printSyntax
    fi
    ;;
  e)
    empty=true
    ;;
  p)
    publicPort=$OPTARG
    ;;
  s)
    shutdown=true
    ;;
  t)
    tag=$OPTARG
    ;;
  w)
    startWeb=true
    ;;
  *)
    printSyntax
    ;;
  esac
done

# Check for no further parameters
shift $((OPTIND-1))
if [ "$1" != "" ]
then
  printSyntax
fi

# If the container is already running, stop it
$cmd ps | grep $n | cut -f1 -d" " | while read cont
do
  $cmd stop $cont
done

if $shutdown
then
  echo "Container has been shutdown."
  exit 0
fi

# The names of the secrets, as known by the container
secretApp="mqAppPassword"
secretAdm="mqAdminPassword"

# And here we set the actual password values to "password".
# Passwords cannot be set by environment variables, but have to be mounted as secrets
# into the container. In a production environment, we'd use some kind of vault to mount the secrets,
# but we'll do it directly here.
# Podman and the basic docker programs have different ways of managing secrets.
if [ $cmd = "docker" ]
then
  echo "Using docker as container manager."
  rm -rf secrets
  mkdir -p secrets
  echo "password" > secrets/$secretApp
  echo "password" > secrets/$secretAdm
  chmod a+r secrets/*
  # Mount the passwords directly into the same file locations as would be used if we were running "docker service" and
  # using its secrets manager.
  secretLines="-v `pwd`/secrets/$secretApp:/run/secrets/$secretApp -v `pwd`/secrets/$secretAdm:/run/secrets/$secretAdm"
else
  echo "Using podman as container manager."
  echo "password" | $cmd secret create --replace=true $secretApp -
  echo "password" | $cmd secret create --replace=true $secretAdm -
  secretLines="--secret $secretApp --secret $secretAdm"
fi

# Do we already have a suitable image? If not, pull the latest
c=`$cmd images -a | grep $n | head -n 1 | awk '{printf("%s:%s\n",$1,$2)}'`
if [ -z "$c" ]
then
  c=icr.io/ibm-messaging/mq:$tag
fi
echo "Image is $c"

# Give the "-e" option to start with an empty environment. But it will slow
# down multiple executions as we have to wait for the qmgr to be running. So it
# is not the default in this script.
if $empty
then
  $cmd volume rm $volume #>/dev/null 2>&1
fi

# Create a volume where the qmgr data will be stored.
$cmd volume create $volume >/dev/null 2>&1

# Ensure any setup MQSC is readable
if [ -r test_setup.mqsc ]
then
  chmod a+r test_setup.mqsc
fi

# Run the container, with the qmgr's TCP port published at 1413, as you
# might have 1414 already in use locally. We do not need the webserver.
# For TLS testing, will need to create a keystore and then mount it into
# the container
$cmd run  \
  --rm \
  --env LICENSE=accept \
  --env MQ_QMGR_NAME=QM1 \
  --env MQ_ENABLE_EMBEDDED_WEB_SERVER=$startWeb \
  --env AMQ_IODELAY=5000000 \
  -v $volume:/var/mqm \
  --detach \
  $secretLines \
  --publish $publicPort:1414 \
  $c

sleep 5

# Did it start?
cnt=`$cmd ps | grep $n | cut -d" " -f1`
if [ -z "$cnt" ]
then
  echo "ERROR: Container has not started"
  exit 1
else
  echo "Container ID is: $cnt"
fi

# Wait until the queue manager is fully running
echo "Waiting for queue manager to be ready"
while true
do
  printf "."
  $cmd exec -it $cnt /opt/mqm/bin/dspmq -n -m QM1 | grep -q RUNNING
  if [ $? -eq 0 ]
  then
    break
  fi
  sleep 5
done

echo
echo "Queue Manager is running"
