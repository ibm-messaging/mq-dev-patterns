#!/bin/bash

function setupQ {
  if [ "$CMD_CONT" = "" ]
  then
     CMD_CONT="podman"
  fi
  cont=`$CMD_CONT ps | grep ibm-messaging | awk '{print $1}'`
  cat << EOF | $CMD_CONT exec -it $cont runmqsc -e QM1 >/dev/null 2>&1
DEF QL(DEV.QUEUE.1) BOQNAME(DEV.QUEUE.BACKOUT) BOTHRESH(3) REPLACE
DEF QL(DEV.QUEUE.BACKOUT) REPLACE

* Using automatic backout processing requires additional authorities: PASSALL
SET AUTHREC PROFILE(DEV.QUEUE.BACKOUT)     OBJTYPE(QUEUE)  PRINCIPAL('app') AUTHADD(PASSALL, GET, BROWSE, PUT, INQ)
SET AUTHREC PROFILE(DEV.DEAD.LETTER.QUEUE) OBJTYPE(QUEUE)  PRINCIPAL('app') AUTHADD(PASSALL, GET, BROWSE, PUT, INq)

END
EOF
}

. common

curdir=`pwd`
logFile=$curdir/logs/test-transe.log

cd ../transactions/JMS/SE

# Get rid of any dangling executions
ps -ef|grep SimpleJmsTran | grep -v grep | awk '{print $2}' | xargs kill 2>/dev/null

CP=/opt/mqm/java/lib/com.ibm.mq.jakarta.client.jar
CP=$CP:/opt/mqm/java/lib/jakarta.jms-api.jar
CP=$CP:/opt/mqm/java/lib/org.json.jar
CP=$CP:.

rm -f mqjms.log*

find com -name *.class | xargs rm -f

# This also builds Common.java as it's needed
find com -name S*.java | while read f
do
  b=`basename $f .java`
  echo "Building scenario: $b"
  javac -cp "$CP"  com/ibm/mq/samples/jms/$b.java
  if [ $? -ne 0 ]
  then
    echo "ERROR: Cannot build $b"
    exit 1
  fi
done

# The config values that are different from the defaults
export PORT=1413
export APP_PASSWORD=password

setupQ
clearQ

(

java  -cp "$CP"  com.ibm.mq.samples.jms.SimpleJmsTransaction
checkRc $? "SNG"
clearQ
echo
java  -cp "$CP"  com.ibm.mq.samples.jms.SimpleJmsTransMulti
checkRc $? "MLT"
clearQ
echo

( java  -cp "$CP"  com.ibm.mq.samples.jms.SimpleJmsTransResponse; echo $? > /tmp/rc) &
pid=$!
sleep 1
java  -cp "$CP"  com.ibm.mq.samples.jms.SimpleJmsTransRequest
checkRc $? "REQ"
wait $pid
checkRc `cat /tmp/rc` "RES"
echo
) 2>&1 | tee $logFile
cnt=`grep "ended OK" $logFile | wc -l `

# We should have successfully run 4 tests
expect=4
if [ $cnt -ne $expect ]
then
  echo "ERROR: Got $cnt successes, not the expected $expect"
  exit 1
fi

rm -f mqjms.log*
exit 0
