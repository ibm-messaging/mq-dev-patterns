"""Example of putting a message to an IBM MQ queue
"""
# -*- coding: utf-8 -*-
# Copyright 2018, 2025 IBM Corp.
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

import json
import datetime
import logging

import ibmmq as mq

from utils.env import EnvStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def connect():
    """ Establish connection to MQ Queue Manager """
    logger.info('Establishing Connection with MQ Server')
    try:
        cd = None
        if not EnvStore.ccdt_check():
            logger.info('CCDT URL export is not set, will be using json environment client connections settings')

            cd = mq.CD(Version=mq.CMQXC.MQCD_VERSION_11)
            cd.ChannelName = MQDetails[EnvStore.CHANNEL]
            cd.ConnectionName = conn_info
            cd.ChannelType = mq.CMQXC.MQCHT_CLNTCONN
            cd.TransportType = mq.CMQXC.MQXPT_TCP

            logger.info('Checking cipher details')
            # If a cipher is set then set the TLS settings
            if MQDetails[EnvStore.CIPHER]:
                logger.info('Making use of cipher details')
                cd.SSLCipherSpec = MQDetails[EnvStore.CIPHER]

        # Key repository is not specified in CCDT so look in environment settings
        # Create an empty SCO object
        sco = mq.SCO()
        if MQDetails[EnvStore.KEY_REPOSITORY]:
            logger.info('Setting Key repository')
            sco.KeyRepository = MQDetails[EnvStore.KEY_REPOSITORY]

        qmgr = mq.QueueManager(None)

        csp = mq.CSP()
        csp.CSPUserId = credentials[EnvStore.USER]
        csp.CSPPassword = credentials[EnvStore.PASSWORD]

        qmgr.connect_with_options(MQDetails[EnvStore.QMGR],
                                  csp=csp, cd=cd, sco=sco)
        return qmgr

    except mq.MQMIError as e:
        logger.error('Error connecting')
        logger.error(e)
        return None

def get_queue():
    """Establish access to queue"""
    logger.info('Opening queue')
    try:
        # Different ways to open a queue.
        q = mq.Queue(qmgr)

        od = mq.OD()
        od.ObjectName = MQDetails[EnvStore.QUEUE_NAME]
        q.open(od, mq.CMQC.MQOO_OUTPUT)

        return q

    except mq.MQMIError as e:
        logger.error('Error opening queue')
        logger.error(e)
        return None

def put_message():
    """Put message onto queue"""
    logger.info('Attempting put to queue')
    try:
        md = mq.MD()
        md.Format = mq.CMQC.MQFMT_STRING
        msg = str(json.dumps(msg_object))
        queue.put(msg,md)

        logger.info('Put message successful: %s',msg)
    except mq.MQMIError as e:
        logger.error('Error in put to queue')
        logger.error(e)

def build_mq_details():
    """Create the connection details for the queue manager"""
    for key in [EnvStore.QMGR, EnvStore.QUEUE_NAME, EnvStore.CHANNEL, EnvStore.HOST,
                EnvStore.PORT, EnvStore.KEY_REPOSITORY, EnvStore.CIPHER]:
        MQDetails[key] = EnvStore.getenv_value(key)

# Application Logic starts here
logger.info('Application "BasicPut" is starting')

envStore = EnvStore()
envStore.set_env()

MQDetails = {}
credentials = {
    EnvStore.USER: EnvStore.getenv_value(EnvStore.APP_USER),
    EnvStore.PASSWORD: EnvStore.getenv_value(EnvStore.APP_PASSWORD)
}

build_mq_details()
conn_info = EnvStore.get_connection(EnvStore.HOST, EnvStore.PORT)

logger.info('Connection is %s', conn_info)

msg_object = {
    'Greeting': 'Hello from Python! ' + str(datetime.datetime.now())
}

qmgr = None
queue = None

qmgr = connect()
if qmgr is not None:
    queue = get_queue()
if queue is not None:
    put_message()
    queue.close()

if qmgr is not None:
    qmgr.disconnect()

logger.info('Application is ending')
