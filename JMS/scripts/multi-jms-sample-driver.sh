#!/bin/bash
#
# (c) Copyright IBM Corporation 2023
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


function stopTail() {
  if [ "$alreadyTrapped" -eq false ]
    then
      alreadyTrapped=true
      echo $eyeCatcher"No longer tailing logs, <ctrl-c> again to stop applications if they are still running."
    else
      kill -5 $(jobs -p) > /dev/null 2>&1
      exit 130 #SIGNINT
  fi
}

alreadyTrapped=false
eyeCatcher="#### " # Make it easier to spot script messages in terminal
numInstances=12 # Default number of applications to start
appClassName=com.ibm.mq.samples.jms.JmsGet # Default jms application for demo (JMS consumers)
logFileName="log" # Log file name prefix for application instance logs
maxLogsToTail=6 # Attempt to tail the first $maxLogsToTail for readbility 

# if you want your logs to be overwritten, set 'overwriteLogs' to true
overwriteLogs=false # Don't overwrite existing logs by default

classPath="../target/mq-dev-patterns-0.1.0.jar" # MAVEN classpath
# classPath="../com.ibm.mq.allclient-9.3.3.0.jar:../javax.jms-api-2.0.1.jar:../json-20230227.jar" # default classpath for dev-patterns JMS application. See https://ibm.biz/learn-mq 

# Check if CCDT is set
if test -z "$MQCCDTURL"
  then
    echo $eyeCatcher "ERROR: MQCCDTURL not set."
    echo $eyeCatcher "export MQCCDTURL=file:///<your_CCDT_file>"
    exit 1
fi
 
# Check to see how many arguments were passed
if [ "$#" -ne 2 ]
  then
    if [ "$#" -eq 0 ] # If no arguments are passed in, assume defaults
      then 
        # Report proceeding with defaults
        echo $eyeCatcher"Running with defaults: starting "$numInstances" instances of "$appClassName"."
        echo ""
      else 
        echo $eyeCatcher "Invalid arguments."
        echo "Usage: $0 <jms_application_name> <number_of_instances>" # Display usage information for script
        echo "Example: $0 " $appClassName $numInstances
        echo ""
        exit 1 # Exit with error code
    fi
  else 
    # Two arguments provides, set appClassName and numInstances
    appClassName=$1
    numInstances=$2
fi


if [ "$overwriteLogs" -eq false ]
  then
    #Check if any previous log files exist
    echo $eyeCatcher "Checking $numLogFilesToCheck files."
    for i in $(seq 1 $numLogFilesToCheck)
      do
        echo $eyeCatcher "Checking if log file $logFileName$i.txt exists"
        if test -f $logFileName$i.txt
          then
            echo $eyeCatcher "WARNING log file >> $logFileName$i.txt << already exists. Please delete and run script again"
            exit 1
        fi
      done
fi

logsToTail=""; # List of log files to tail

# Trap control-c interupt on tail
trap stopTail SIGINT

for i in $(seq 1 $numInstances)
  do
    echo Starting instance $i
    java -DMQCCDTURL=$MQCCDTURL -DEnvFile=../../env.json -cp $classPath:. $appClassName > $logFileName$i.txt 2>&1 &
    if [ "$i" -le $maxLogsToTail ]
      then
        # Append lof to list to tail
        logsToTail=$logsToTail" $logFileName$i.txt"
    fi
  done

echo ""
echo $eyeCatcher "Ready to tail first "$maxLogsToTail" log files."
sleep 0.5
# Start tailing the logs
tail -f $logsToTail
# Following SIGINT on tail 
echo $eyeCatcher "Waiting for jms applications to finish."
# Wait for jms applications to complete before exit
wait $jobs
exit 0