#!/bin/bash

#
# Copyright 2021 IBM Corp.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
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
#

export QM_NAME="Queue Manager Name goes here"
export HOSTNAME="MQ Hostname goes here"
export QM_PORT=443
export QUEUE="Queue Name goes here"
export MQ_USER="MQ app user id goes here"
export MQ_PASSWORD="MQ password goes here"

export MQ_DB="mqfunctions"
export MQ_DB_KEY="memory"
export CLOUDANT_HOSTNAME="Cloudant hostname goes here"
export CLOUDANT_USERNAME="Cloudant username goes here"
export CLOUDANT_PASSWORD="Cloudant password goes here"
export CLOUDANT_KEY="Cloudant IAM API Key goes here"

ibmcloud fn deploy -m mqfunctions.yml
ibmcloud fn rule disable rule-mq-fire-trigger
