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
import pymqi

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# function to establish connection to MQ Queue Manager

def connect():
    logger.info('Establising Connection with MQ Server')
    try:
        cd = pymqi.CD(Version=pymqi.CMQXC.MQCD_VERSION_11)
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
        # Works with single call, but object Descriptor
        # provides other options
        # q = pymqi.Queue(qmgr, MQDetails['QUEUE_NAME'])
        q = pymqi.Queue(qmgr)

        od = pymqi.OD()
        od.ObjectName = MQDetails['QUEUE_NAME']

        odOptions = pymqi.CMQC.MQOO_INPUT_AS_Q_DEF
        q.open(od, odOptions)

        return q
    except pymqi.MQMIError as e:
        logger.error("Error getting queue")
        logger.error(e)
        return None

# function to get message from Queue


def getMessages():
    logger.info('Attempting gets from Queue')
    # Message Descriptor
    md = pymqi.MD()

    # Get Message Options
    # MQGMO_NO_PROPERTIES indicates that JMS headers are to be stripped
    # off the message during the get. This can also be done by calling
    # .get_no_jms on the queue instead of .get
    gmo = pymqi.GMO()
    gmo.Options = pymqi.CMQC.MQGMO_WAIT | \
                       pymqi.CMQC.MQGMO_FAIL_IF_QUIESCING | \
                       pymqi.CMQC.MQGMO_NO_PROPERTIES

    gmo.WaitInterval = 5000  # 5 seconds

    keep_running = True
    while keep_running:
        try:
            # Reset the MsgId, CorrelId & GroupId so that we can reuse
            # the same 'md' object again.
            md.MsgId = pymqi.CMQC.MQMI_NONE
            md.CorrelId = pymqi.CMQC.MQCI_NONE
            md.GroupId = pymqi.CMQC.MQGI_NONE

            # Wait up to to gmo.WaitInterval for a new message.
            # message = queue.get_no_jms(None, md, gmo)
            message = queue.get(None, md, gmo)

            # Process the message here..
            msgObject = json.loads(message.decode())
            logger.info('Have message from Queue')
            logger.info(msgObject)

        except pymqi.MQMIError as e:
            if e.comp == pymqi.CMQC.MQCC_FAILED and e.reason == pymqi.CMQC.MQRC_NO_MSG_AVAILABLE:
                # No messages, we should more on to next connection endpoint if there is one.
                logger.info('No more messages found on this connection')
                keep_running = False
            else:
                # Some other error condition.
                raise

        except (UnicodeDecodeError, ValueError) as e:
            logger.info('Message is not valid json')
            logger.info(e)
            logger.info(message)
            continue

        except KeyboardInterrupt:
            logger.info('Have received a keyboard interrupt')
            keep_running = False


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

#conn_info = "%s(%s)" % (MQDetails['HOST'], MQDetails['PORT'])
#conn_info = EnvStore.getConnection('HOST', 'PORT')

qmgr = None
queue = None

numEndPoints = envStore.getEndpointCount()
logger.info('There are %d connections' % numEndPoints)

for conn_info in envStore.getNextConnectionString():
    logger.info('Using Connection String %s' % conn_info)

    qmgr = connect()
    if (qmgr):
        queue = getQueue()
    if (queue):
        getMessages()
        queue.close()

    if (qmgr):
        qmgr.disconnect()

logger.info("Application is closing")
