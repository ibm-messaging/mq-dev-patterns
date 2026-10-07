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

# Run some linting processes against the Python modules
# We'll use both flake8 and pylint which show different things.

curdir=`pwd`
root=$curdir/..

# My VENV directory where flake8 is installed
venv=venv
. $root/tests/$venv/bin/activate
if [ $? -ne 0 ]
then
  echo "ERROR: Cannot activate venv: $venv"
  exit 1
fi

# Uncomment these lines the first time we create the VENV
#pip install flake8 pylint
#pip install ddt
#pip install ibmmq


# Build a list of where we want to search
dirs=""
dirs="$dirs $root/Python"

# Can add specific files too
files=""

args="$*"
if [ -z "$args" ]
then
  args="."
fi

for d in $dirs $files
do
  if [ -d $d ]
  then
    cd $d
  else
    cd $root
    args=$d
  fi

  # Lots of complaints that classes from the "typing" module
  # are not used. But they ARE needed in the comment/annotation processing.
  flake8 --config=$curdir/tox.ini $args | grep -v typing

  export PYTHONPATH=$root/tests/venv:.
  # Examples have a lot of variables that really should be considered constants so we
  # bypass that subclass of the invalid-name test via the pylintrc config. Some other explicit
  # warnings disabled in the source code with comment directives.
  pylint --rcfile=$curdir/pylintrc $args 2>&1 | grep -v "Module 'ibmmq" 2>&1

done
