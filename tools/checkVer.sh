#!/bin/bash

#
# (c) Copyright IBM Corporation 2026
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

# Purpose: Find the versions of MQ dependencies that are in this repo and print ones that
#          are out of date. There is no automatic update; changes have to be reviewed and
#          made manually.
#
#          There are various assumptions about the config files that name the dependencies, and
#          their content/format. While these assumptions seem to hold true for now for the
#          dev-patterns repo, they might not be true forever. Or be valid for other repos.
#          For example, Java programs are assumed to be controlled by mvn/pom.xml, but not
#          gradle.
#
#          Some searches look for "*.yaml", but not "*.yml" as that's not used in dev-patterns outside
#          other dependencies that we don't care about.
#
#          There still might be files missed by the searches.
#
#          There is no attempt to look for changes in other dependencies.
#          Dependabot is one approach to manage those.
#
# Parameters: $1: root of repository to check. Current directory if not given
#
# NOTES:
#   There's little error handling in here.
#   So you should always check the recommendations for sanity before taking any action.
#
# Prereqs: jq, curl, dos2unix, html2text [dnf install python3-html2text].
#          yq is a soft prereq

function myCurl {
    # Run curl looking for bad return codes and bad http status codes.
    # stderr is left alone, so any serious error ought to be shown on the screen.
    code=`curl -fsSL -k -o $tmpfile -w '%{http_code}\n' $*`
    rc=$?
    if [ $rc -ne 0 ] || [ $code -ne 200 ]
    then
      echo "N/A"
    else
      cat $tmpfile
    fi
}

function getLatestNPM {
    pkg=$1
    myCurl "https://registry.npmjs.org/$pkg/latest" | jq -r '.version'
}

function getLatestGo {
    repo=$1
    # gh release -R github.com/$repo --json tagName,isLatest ls  | jq -r '.[] | select(.isLatest == true) | .tagName'
    myCurl https://api.github.com/repos/$repo/releases/latest | jq -r '.tag_name'
}

function getLatestPython {
    pkg=$1
    # pip index versions --pre $pkg | grep "^$pkg" | awk '{print $2}' | sed "s/(//g;s/)//g"
    myCurl https://pypi.org/pypi/$pkg/json | jq -r '.info.version'
}

function getLatestJar {
  # Assume the com.ibm.mq namespace by default
  jar=$1
  if [ -z "$2" ]
  then
     namespace="com.ibm.mq"
  fi
  # The dotted name gets transformed into a path
  namespace=`echo $namespace | sed "s/\./\//g"`
  myCurl "https://repo1.maven.org/maven2/$namespace/$jar/maven-metadata.xml" | grep "<version>" | sed "s/</ /g;s/>/ /g" | awk '{print $2}' | $sort -V  | tail -1
}

function getLatestDotNet {
  pkg=$1

  # Searching NuGet is a two-step process.
  # First have to find the location of a server
  NUGET_SEARCH_URL="https://api.nuget.org/v3/index.json"
  BASE_ADDRESS=$(
  myCurl "$NUGET_SEARCH_URL" \
    | jq -r '.resources[] | select(."@type" == "PackageBaseAddress/3.0.0") | ."@id"' \
    | head -n1
  )

  if [[ -z "$BASE_ADDRESS" ]]; then
    echo "Error: Could not resolve PackageBaseAddress from NuGet index." >&2
    echo "N/A"
  fi

  # Normalise: strip trailing slash
  BASE_ADDRESS="${BASE_ADDRESS%/}"
  pkg=`echo $pkg | tr '[A-Z]' '[a-z]'` # NuGet flat-container uses lowercase IDs

  # And now we can use that base address to do the actual query
  VERSIONS_URL="${BASE_ADDRESS}/${pkg}/index.json"

  myCurl $VERSIONS_URL | jq -r '.versions[]' | $sort -V | tail -1
}

function getLatestMQ {
    # Simply list the directory where we download from
    myCurl https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/redist/ | grep MQC-Redist-LinuxX64 |\
    cut -d">" -f2 | cut -d"\"" -f2 | cut -d- -f1 |\
    $sort -V | tail -1
}

# Do we have prereq commands
function checkCommands {
    rc=0
    for cmd in $*
    do
      which $cmd >/dev/null 2>&1
      if [ $? -ne 0 ]
      then
        echo "Cannot find $cmd"
        rc=1
      fi
    done
    return $rc
}

function major {
    # Get the major number from a version string
    echo $1 | cut -d. -f1
}

# Run this during exit of the script
function cleanup {
    if [ -f $tmpfile ]
    then
      rm -f $tmpfile
    fi
}

#########################
# Main code starts here
#########################

useYQ=true

tmpfile=/tmp/curl.$$.out
dlText=/tmp/dl.out
rm -f $fmpfile $dlText

if [ ! -z "$1" ]
then
  cd $1
  if [ $? -ne 0 ]
  then
    echo "ERROR: Cannot switch directory to $1"
    exit 1
  fi
fi

curdir=`pwd`
basedir=`basename $curdir`

trap cleanup EXIT

# Check prereq commands are available
checkCommands curl jq dos2unix html2text
if [ $? -ne 0 ]
then
  echo "ERROR: At least one required command is not available"
  exit 1
fi

checkCommands yq >/dev/null 2>&1
if [ $? -ne 0 ]
then
  echo "WARNING: Cannot find 'yq' command. Will use alternative approach for parsing XML files"
  useYQ=false
fi

if [ `uname` == "AIX" ]
then
  # Use the GNU sort rather than AIX default for the -V option to work
  sort="/opt/freeware/bin/sort"
else
  sort="sort"
fi

nodeLatest=`getLatestNPM ibmmq`
goLatest=`getLatestGo ibm-messaging/mq-golang`
pythonLatest=`getLatestPython ibmmq`
# Same value for both JMS2 and Jakarta jars so only search once
jmsLatest=`getLatestJar com.ibm.mq.jakarta.client`
springLatest=`getLatestJar mq-jms-spring-boot-starter`
dotnetLatest=`getLatestDotNet IBMXMSDotnetClient`
mqLatest=`getLatestMQ`

echo
echo "Latest versions of MQ components:"
echo "  MQ Redist : $mqLatest"
echo "  MQ JMS    : $jmsLatest"
echo "  MQ .Net   : $dotnetLatest"
echo "  Node      : $nodeLatest"
echo "  Go        : $goLatest"
echo "  Python    : $pythonLatest"
echo "  Spring    : $springLatest"
echo
echo "Searching for configurations under $basedir with older versions"
echo

# Now search for config files that use each of these.
major=`major $nodeLatest`
echo "Node.js projects to update to $nodeLatest ..."
find . -type f -name "package.json" | grep -v node_modules | xargs grep -l ibmmq | while read f
do
  v=`cat $f | jq -r '.dependencies.ibmmq' | sed "s/\^//g"`
  vMajor=`major $v`
  if [ "$v" !=  "$nodeLatest" ] && [ "$vMajor" == "$major" ]
  then
    echo "  $f from $v"
  elif [ "$vMajor" != "$major" ]
  then
    echo "  $f may need major update from $v"
  fi
done
echo

echo "Node.js projects that need \"allowScripts\" option for ibmmq ..."
find . -type f -name "package.json" | grep -v node_modules | xargs grep -l ibmmq | while read f
do
  cat $f | jq '.allowScripts' | grep -q ibmmq
  if [ $? -ne 0 ]
  then
    echo "  $f needs update"
  else
    v=`cat $f | jq '.allowScripts' | grep ibmmq | cut -f1 -d: | awk '{print $1}' | sed "s/\"//g" | cut -d@ -f2`
    if [ ! -z "$v" ] && [ "$v" != "ibmmq" ] && [ "$v" != "$nodeLatest" ]
    then
      echo "  $f needs update from $v"
    fi
  fi
done
echo

echo "Go projects to update to $goLatest ..."
major=`major $goLatest`
(find . -type f -name "go.mod"
find . -type f -name "*.yaml") | xargs grep -l mq-golang | while read f
do
  v=`cat $f | dos2unix | grep "mq-golang" | awk '{print $NF}' | head -1`
  if [ ! -z "$v" ] && [[ "$v" =~ ^v ]]
  then
  vMajor=`major $v`
  if [ "$v" !=  "$goLatest" ] && [ "$vMajor" == "$major" ]
  then
    echo "  $f from $v"
  fi
  fi
done
echo

# for Python, this is only looking at files like requirements.txt for now.
# And the parsing of the line is simplistic: it could be perfectly valid to
# have "ibmmq>=2.0". But the dev-patterns repo doesn't actually have any
# explicit version requirements for Python anyway. Just putting this in here
# for completeness.
echo "Python projects to update to $pythonLatest ..."
major=`major $pythonLatest`
find . -type f -name "requirement*.txt" | xargs grep -l ibmmq | while read f
do
  v=`cat $f | grep ibmmq | awk -F= '{print $NF}'`
  vMajor=`major $v`
  if [ ! -z "$v" ] && [ "$v" !=  "$pythonLatest" ] && [ "$vMajor" == "$major" ]
  then
    echo "  $f from $v"
  fi
done
echo

# We also look for mentions of pymqi
echo "Mentions of \"pymqi\" to update to \"ibmmq\" ..."
find . -type f -name "*.yaml" -o -name "README*" | xargs grep -il pymqi | while read f
do
  echo "  $f still mentions pymqi"
done
echo

# There are several jars that we need to check for. One simple way
# to give the loop the elements needed are as a colon-separated string.
# So we have "artifact id:latest version:does major version matter"
for component in com.ibm.mq.jakarta.client:$jmsLatest:N \
                 com.ibm.mq.allclient:$jmsLatest:N \
                 mq-jms-spring-boot-starter:$springLatest:Y
do
  a=`echo $component | cut -d: -f1` # artifact name
  l=`echo $component | cut -d: -f2` # latest version
  m=`echo $component | cut -d: -f3` # Y=Take special account of major number
  echo "Java component \"$a\" to update to $l ..."

  major=`major $l`

  find . -type f -name pom*.xml | grep -v target/classes | while read f
  do
    # YQ is a better processor than awk for XML files, but may not be available everywhere.
    # Use it if we can; otherwise fallback to awk.
    #
    # The awk variant assumes that the version follows the artifact name in the XML. That's not actually
    # a requirement, so the script might get confused. But it seems to work well enough in
    # the dev patterns repo.
    #
    # It's also assumed we're not using variables in the pom.xml files eg in a common parent properties file.
    if $useYQ
    then
      v=`cat $f | yq -p xml -o json | jq -r '.. | objects | select(.artifactId == "'$a'") | .version'`
    else
      v=`cat $f | dos2unix | awk 'BEGIN {p=0}
                  { if (p) print $0}
                  /'$a'/  {p=1}
                  /<version>/ {p=0}
                  ' |\
                sed "s/<version>//g;s/<\/version>//g" | awk '{print $1}'`
    fi
    # printf "f: %s a: %s l: %s m: %s v: \"%s\"\n" $f $a $l $m $v
    if [ ! -z "$v" ]
    then
      #  if we don't care about major number (eg MQ JMS)
      #    then if they dont match, just print a normal msg
      #  else
      #    if the major doesn't match
      #      strong warn
      #    else
      #      normal warn
      vMajor=`major $v`
      if [ "$v" !=  "$l" ]
      then
        if [ "$m" == "N" ]
        then
          echo "  $f from $v"
        else
          if [ "$vMajor" != "$major" ]
          then
            echo "  $f may need major update from $v"
          else
            echo "  $f from $v"
          fi
        fi
      fi
    fi
  done
  echo
done

# .Net
# csproj
# Don't care about major number, as this one follows MQ product versions
# Like the Java test, we prefer to use YQ. Otherwise the awk script seems OK.
echo ".Net projects to update to $dotnetLatest ..."
find . -type f -name "*.csproj" | xargs grep -il "PackageReference.*IBMXMSDotnet" | while read f
do
  if $useYQ
  then
    v=`cat $f | yq -p xml -o json | jq -r '.. | objects | select(.["+@Include"]=="IBMXMSDotnetClient") | .["+@Version"]'`
  else
    v=`cat $f | grep -i "PackageReference.*IBMXMSDotNet" | awk '{print $(NF-1)}'  |\
      cut -d= -f2 |\
      sed "s/\"//g"`
  fi
  if [ "$v" !=  "$dotnetLatest" ]
  then
    echo "  $f from $v"
  fi
done
echo

# REDIST
# Dockerfile, docker-compose: look for VRMF and image
echo "MQ client to update to $mqLatest ..."
find . -type f -name docker-compose.* | while read f
do
  v=`grep image: $f | grep mq | cut -d: -f3 | cut -d- -f1 | grep -E "[0-9]+"`
  if [ ! -z "$v" ] && [ "$v" != "$mqLatest" ]
  then
    echo "  $f from $v"
  fi
done

find . -type f -name Docker* | while read f
do
  v=`grep "VRMF.*=" $f | cut -d= -f2`
  if [ ! -z "$v" ] && [ "$v" != "$mqLatest" ]
  then
    echo "  $f from $v"
  fi
done
echo

# READMEs and yaml
# Looking for any string matching 9.[0-4] which might be an MQ version but it might not be. Use your judgement.
echo "Other files that might be out of date ..."
find . -type f -name "*yaml" -o -name "READ*" -o -name "*.md" | grep -v node_modules | xargs grep -l "9\.[0-4]" | while read f
do
  echo "  $f"
done
echo "Wherever possible, do not use specific versions in text files."
echo "Appropriate substitutions include \"<version>\" or \"latest\""
echo
echo "Done."
