#!/bin/bash

function endLiberty {
  # Note that it is expected that we see something like "ERROR: An error occurred starting the server"
  # because we are killing it while under mvn control. This is not really an error for this test
  ps -ef|grep "OpenLiberty-MDB" | grep -v grep | grep "defaultServer" | awk '{print $2}' | xargs kill 2>/dev/null
}

. common

curdir=`pwd`
logFile=$curdir/logs/test-jmsmdb.log
rm -f $logFile

cd ../OpenLiberty-MDB
basedir=`pwd`

mvn=/usr/bin/mvn
# A newer version than current version of Fedora has picked up.
# Resolves problem with using Java 25 deprecated methods.
# mvn=/opt/maven/apache-maven-3.9.16/bin/mvn

for dir in jms-2-mdb jakarta-3-mdb
do
  clearQ

  cd $basedir/$dir

  # Get rid of any dangling executions
  endLiberty

  # Make sure we don't override loglevels
  export MAVEN_SKIP_RC=1

  # This overrides the port for the CF to connect to from Liberty
  export ibmmq_port=1413

  rm -rf target

  mvn clean
  # Try to filter out the error generated when we kill Liberty
  (mvn -DskipTests=1 liberty:dev 2>&1| grep -v CWWKM2002E | tee -a $logFile )&
  pid=$!
  echo "Waiting for Liberty to start "
  while true
  do
    printf "."
    curl localhost:9081 >/dev/null 2>&1
    if [ $? -eq 0 ]
    then
      printf "\n"
      echo "Liberty is now ready to accept connections"
      echo
      break
    fi
    sleep 3
  done

  # Build and run the producer program
  unset MAVEN_SKIP_RC
  cd $basedir/producer

  $mvn clean package
  rc=$?

  export CONFIG_JSON_FILE=$curdir/env_test.json
  if [ $rc -eq 0 ]
  then
    java -cp target/ibm-mq-liberty-producer-0.1.0.jar: com.ibm.mq.samples.jms.JmsPut
    rc=$?
  fi
  sleep 5

  # All done ... end the liberty server
  kill $!
  wait $!
  sleep 5

  rm -rf mqjms.log* FFDC
  if [ $rc -ne 0 ]
  then
    exit 1
  fi
done

# Run the different server variants. Did we get the expected output?
# Cleanup and exit.
echo
endLiberty

cnt=`grep "Messaging MDB received" $logFile | wc -l`
if [ $cnt -ne 2 ]
then
  echo "ERROR: Mismatch in received message count"
  exit 1
else
  echo "*** Received expected message count"
fi

exit 0