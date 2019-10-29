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
def getQueue():
    logger.info('Connecting to Queue')
    try:
        # Can do this in one line, but with an Object Descriptor
        # can or in more options.
        # q = pymqi.Queue(qmgr, MQDetails['QUEUE_NAME'])
        q = pymqi.Queue(qmgr)

        od = pymqi.OD()
        od.ObjectName = MQDetails['QUEUE_NAME']
        q.open(od, pymqi.CMQC.MQOO_OUTPUT)

        return q

    except pymqi.MQMIError as e:
        logger.error("Error getting queue")
        logger.error(e)
        return None

# function to put message onto Queue
def putMessage():
    logger.info('Attempting put to Queue')
    try:
        md = pymqi.MD()
        md.Format = pymqi.CMQC.MQFMT_STRING
        # queue.put(json.dumps(msgObject).encode())
        # queue.put(json.dumps(msgObject))
        # queue.put(str(json.dumps(msgObject)))
        #queue.put(bytes(json.dumps(msgObject), 'utf-8'))
        queue.put(EnvStore.stringForVersion(json.dumps(msgObject)),md)

        logger.info("Put message successful")
    except pymqi.MQMIError as e:
        logger.error("Error in put to queue")
        logger.error(e)


def buildMQDetails():
    for key in ['QMGR', 'QUEUE_NAME', 'CHANNEL', 'HOST',
                'PORT', 'KEY_REPOSITORY', 'CIPHER']:
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

conn_info = EnvStore.getConnection('HOST', 'PORT')
#conn_info = "%s(%s)" % (MQDetails['HOST'], MQDetails['PORT'])

logger.info('Connection is %s' % conn_info)


msgObject = {
    'Greeting': "Hello from Python! " + str(datetime.datetime.now())
}

qmgr = None
queue = None

qmgr = connect()
if (qmgr):
    queue = getQueue()
    # queue.put(message.encode())
if (queue):
    putMessage()
    queue.close()

if (qmgr):
    qmgr.disconnect()

logger.info("Application is closing")
