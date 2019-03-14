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
import random
import math
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


def getQueue(queueName, forInput):
    logger.info('Connecting to Queue')
    try:
        # Works with single call, but object Descriptor
        # provides other options
        # q = pymqi.Queue(qmgr, MQDetails['QUEUE_NAME'])
        q = pymqi.Queue(qmgr)

        od = pymqi.OD()
        od.ObjectName = queueName

        if (forInput):
            odOptions = pymqi.CMQC.MQOO_INPUT_AS_Q_DEF
        else:
            od.ObjectType = pymqi.CMQC.MQOT_Q
            odOptions = pymqi.CMQC.MQOO_OUTPUT

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
    gmo = pymqi.GMO()
    gmo.Options = pymqi.CMQC.MQGMO_WAIT | pymqi.CMQC.MQGMO_FAIL_IF_QUIESCING
    gmo.WaitInterval = 5000  # 5 seconds

    keep_running = True
    while keep_running:
        try:
            # Wait up to to gmo.WaitInterval for a new message.
            message = queue.get(None, md, gmo)

            # Process the message here..
            msgObject = json.loads(message.decode())
            logger.info('Have message from Queue')
            logger.info(msgObject)

            respondToRequest(md, msgObject)

            # Reset the MsgId, CorrelId & GroupId so that we can reuse
            # the same 'md' object again.
            md.MsgId = pymqi.CMQC.MQMI_NONE
            md.CorrelId = pymqi.CMQC.MQCI_NONE
            md.GroupId = pymqi.CMQC.MQGI_NONE

        except pymqi.MQMIError as e:
            if e.comp == pymqi.CMQC.MQCC_FAILED and e.reason == pymqi.CMQC.MQRC_NO_MSG_AVAILABLE:
                # No messages, that's OK, we can ignore it.
                pass
            else:
                # Some other error condition.
                raise

        except KeyboardInterrupt:
            logger.info('Have received a keyboard interrupt')
            keep_running = False


def respondToRequest(md, msgObject):
    # Create a response message descriptor with the CorrelId
    # set to the value of MsgId of the original request message.
    response_md = pymqi.MD()
    response_md.CorrelId = md.CorrelId
    response_md.MsgId = md.MsgId

    msgReply = {
        'Greeting': "Reply from Python! " + str(datetime.datetime.now()),
        'value': random.randint(1, 101)
    }
    replyQueue = getQueue(md.ReplyToQ, False)
    if (msgObject['value']):
        msgReply['value'] = performCalc(msgObject['value'])
    #replyQueue.put(str(json.dumps(msgReply)),response_md )
    replyQueue.put(EnvStore.stringForVersion(
        json.dumps(msgReply)), response_md)


def performCalc(n):
    sqRoot = math.floor(math.sqrt(n))
    a = []
    i = 2
    j = 1

    while (sqRoot <= n and i <= sqRoot):
        if (0 == n % i):
            a.append(i)
            n /= i
        else:
            j = 2 if i > 2 else 1
            i += j
    return a


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
logger.info(credentials)

#conn_info = "%s(%s)" % (MQDetails['HOST'], MQDetails['PORT'])
conn_info = EnvStore.getConnection('HOST', 'PORT')

qmgr = None
queue = None

qmgr = connect()
if (qmgr):
    queue = getQueue(MQDetails['QUEUE_NAME'], True)
if (queue):
    getMessages()
    queue.close()

if (qmgr):
    qmgr.disconnect()

logger.info("Application is closing")
