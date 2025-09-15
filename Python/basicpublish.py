"""Example of publishing a message to an IBM MQ topic
"""
# -*- coding: utf-8 -*-
# Copyright 2019, 2025 IBM
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
        if not EnvStore.is_ccdt_available():
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

        # Set credentials
        csp = mq.CSP()
        csp.CSPUserId = EnvStore.getenv_value(EnvStore.APP_USER)
        csp.CSPPassword = EnvStore.getenv_value(EnvStore.APP_PASSWORD)
        if csp.CSPUserId is None:
            csp = None

        qmgr.connect_with_options(MQDetails[EnvStore.QMGR],
                                  csp=csp,
                                  cd=cd, sco=sco)
        return qmgr

    except mq.MQMIError as e:
        logger.error('Error connecting: %s', e)
        return None

def get_topic():
    """Establish access to a Topic"""
    logger.info('Opening a topic')
    try:
        t = mq.Topic(qmgr, topic_string=MQDetails[EnvStore.TOPIC_NAME])
        t.open(open_opts=mq.CMQC.MQOO_OUTPUT)
        return t
    except mq.MQMIError as e:
        logger.error('Error opening topic: %s', e)
        return None

def publish_message():
    """Publish a message"""
    logger.info('Attempting publish to topic')
    try:
        md = mq.MD()
        md.Format = mq.CMQC.MQFMT_STRING
        msg = str(json.dumps(msg_object))
        topic.pub(msg, md)
        logger.info('Publish message successful: %s', msg)
    except mq.MQMIError as e:
        logger.error('Error in publish to topic: %s', e)

def build_mq_details():
    """Create the connection details for the queue manager"""
    for key in [EnvStore.QMGR, EnvStore.CHANNEL, EnvStore.HOST,
                EnvStore.PORT, EnvStore.KEY_REPOSITORY, EnvStore.CIPHER, EnvStore.TOPIC_NAME]:
        MQDetails[key] = EnvStore.getenv_value(key)

# Application Logic starts here
logger.info('Application "BasicPublish" is starting')

envStore = EnvStore()
envStore.set_env()

MQDetails = {}

build_mq_details()

conn_info = EnvStore.get_connection(EnvStore.HOST, EnvStore.PORT)

msg_object = {
    'Greeting': 'Hello from Python! ' + str(datetime.datetime.now())
}

qmgr = None
topic = None

qmgr = connect()
if qmgr is not None:
    topic = get_topic()
if topic is not None:
    publish_message()
    topic.close()

if qmgr is not None:
    qmgr.disconnect()

logger.info('Application is ending')
