# -*- coding: utf-8 -*-
# Copyright 2019 IBM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from utils.env import EnvStore
import os
import json
import datetime
import pymqi

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# function to establish connection to MQ Queue Manager

def connect():
    logger.info('Establising Connection with MQ Server')
    try:
        cd = pymqi.CD()
        cd.ChannelName = MQDetails['CHANNEL']
        cd.ConnectionName = conn_info
        cd.ChannelType = pymqi.CMQC.MQCHT_CLNTCONN
        cd.TransportType = pymqi.CMQC.MQXPT_TCP

        # Create an empty SCO object, and optionally set TLS settings
        # if a cipher is set in the envrionment variables.
        sco = pymqi.SCO()
        if MQDetails['CIPHER']:
            cd.SSLCipherSpec = MQDetails['CIPHER']
            sco.KeyRepository = MQDetails['KEY_REPOSITORY']

        #options = pymqi.CMQC.MQPMO_NO_SYNCPOINT | pymqi.CMQC.MQPMO_NEW_MSG_ID | pymqi.CMQC.MQPMO_NEW_CORREL_ID
        options = pymqi.CMQC.MQPMO_NEW_CORREL_ID

        qmgr = pymqi.QueueManager(None)
        qmgr.connect_with_options(MQDetails['QMGR'],
                                  user=credentials['USER'],
                                  password=credentials['PASSWORD'],
                                  opts=options, cd=cd, sco=sco)
        return qmgr
    except pymqi.MQMIError as e:
        logger.error("Error connecting")
        logger.error(e)
        return None


# function to establish connection to Queue
def getTopic():
    logger.info('Connecting to Topic')
    try:
        t = pymqi.Topic(qmgr, topic_string=MQDetails['TOPIC_NAME'])
        t.open(open_opts=pymqi.CMQC.MQOO_OUTPUT)
        return t
    except pymqi.MQMIError as e:
        logger.error("Error getting topic")
        logger.error(e)
        return None

# function to put message onto Queue


def publishMessage():
    logger.info('Attempting publish to Topic')
    try:
        md = pymqi.MD()
        md.Format = pymqi.CMQC.MQFMT_STRING
        # queue.put(json.dumps(msgObject).encode())
        # queue.put(json.dumps(msgObject))
        # topic.pub(str(json.dumps(msgObject)))
        topic.pub(EnvStore.stringForVersion(json.dumps(msgObject)), md)

        logger.info("Publish message successful")
    except pymqi.MQMIError as e:
        logger.error("Error in publish to topic")
        logger.error(e)


def buildMQDetails():
    for key in ['QMGR', 'CHANNEL', 'HOST',
                'PORT', 'KEY_REPOSITORY', 'CIPHER', 'TOPIC_NAME']:
        MQDetails[key] = EnvStore.getEnvValue(key)


# Application Logic starts here
logger.info("Application is Starting")

envStore = EnvStore()
envStore.setEnv()

MQDetails = {}
credentials = {
    'USER': EnvStore.getEnvValue('APP_USER'),
    'PASSWORD': EnvStore.getEnvValue('APP_PASSWORD')
}

buildMQDetails()

logger.info('Credentials are set')
#logger.info(credentials)

#conn_info = "%s(%s)" % (MQDetails['HOST'], MQDetails['PORT'])
conn_info = EnvStore.getConnection('HOST', 'PORT')

msgObject = {
    'Greeting': "Hello from Python! " + str(datetime.datetime.now())
}

qmgr = None
topic = None

qmgr = connect()
if (qmgr):
    topic = getTopic()
    # queue.put(message.encode())
if (topic):
    publishMessage()
    topic.close()

if (qmgr):
    qmgr.disconnect()

logger.info("Application is closing")
