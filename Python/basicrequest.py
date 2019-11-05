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

# function to establish connection to Queue


def getDynamicQueue():
    logger.info('Connecting to Dynmic Queue')
    try:
        # Dynamic queue's object descriptor.
        dyn_od = pymqi.OD()
        dyn_od.ObjectName = MQDetails['MODEL_QUEUE_NAME']
        dyn_od.DynamicQName = MQDetails['DYNAMIC_QUEUE_PREFIX']

        # Open the dynamic queue.
        dyn_input_open_options = pymqi.CMQC.MQOO_INPUT_EXCLUSIVE
        dyn_queue = pymqi.Queue(qmgr, dyn_od, dyn_input_open_options)

        dynamicQueueName = dyn_od.ObjectName.strip()
        logger.info('Dynamic Queue Details are')
        logger.info(dynamicQueueName)

        return dyn_queue, dynamicQueueName

    except pymqi.MQMIError as e:
        logger.error("Error getting queue")
        logger.error(e)
        return None


# function to put message onto Queue
def putMessage():
    logger.info('Attempting put to Queue')
    try:
        # queue.put(json.dumps(msgObject).encode())
        # queue.put(json.dumps(msgObject))

        # Prepare a Message Descriptor for the request message.
        logger.info('Dynamic Queue Name is ')
        logger.info(dynamic['name'])
        md = pymqi.MD()
        md.ReplyToQ = dynamic['name']
        md.MsgType = pymqi.CMQC.MQMT_REQUEST
        md.Format = pymqi.CMQC.MQFMT_STRING

        # Send the message.
        #queue.put(str(json.dumps(msgObject)), md)
        queue.put(EnvStore.stringForVersion(json.dumps(msgObject)), md)
        # queue.put(str(json.dumps(msgObject)), md)
        # queue.put("Hello")

        logger.info("Put message successful")
        #logger.info(md.CorrelID)
        return md.MsgId, md.CorrelId
        # return md.CorrelId
    except pymqi.MQMIError as e:
        logger.error("Error in put to queue")
        logger.error(e)

# Function to wait for resonse on reply to Queue


def awaitResponse(msgId, correlId):
    logger.info('Attempting get from Reply Queue')

    # Message Descriptor
    md = pymqi.MD()
    md.MsgId = msgId
    md.CorrelId = correlId

    # Get Message Options
    gmo = pymqi.GMO()
    gmo.Options = pymqi.CMQC.MQGMO_WAIT | pymqi.CMQC.MQGMO_FAIL_IF_QUIESCING
    gmo.WaitInterval = 5000  # 5 seconds
    #gmo.MatchOptions = pymqi.CMQC.MQMO_MATCH_MSG_ID
    gmo.MatchOptions = pymqi.CMQC.MQMO_MATCH_CORREL_ID
    gmo.Version = pymqi.CMQC.MQGMO_VERSION_2

    keep_running = True
    while keep_running:
        try:
            # Wait up to to gmo.WaitInterval for a new message.
            message = dynamic['queue'].get(None, md, gmo)

            # Process the message here..
            msgObject = json.loads(message.decode())
            logger.info('Have reply message from Queue')
            logger.info(msgObject)

            # Not expecting any more messages
            keep_running = False

        except pymqi.MQMIError as e:
            if e.comp == pymqi.CMQC.MQCC_FAILED and e.reason == pymqi.CMQC.MQRC_NO_MSG_AVAILABLE:
                # No messages, that's OK, we can ignore it.
                pass
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
                'PORT', 'MODEL_QUEUE_NAME', 'DYNAMIC_QUEUE_PREFIX',
                'KEY_REPOSITORY', 'CIPHER']:
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
    'Greeting': "Hello from Python! " + str(datetime.datetime.now()),
    'value': random.randint(1, 101)
}

qmgr = None
queue = None
dynamic = {
    'queue': None,
    'name': None
}
msgid = None
correlid = None

qmgr = connect()
if (qmgr):
    queue = getQueue()
    # queue.put(message.encode())
if (queue):
    dynamic['queue'], dynamic['name'] = getDynamicQueue()

if (dynamic['queue']):
    logger.info('Checking dynamic Queue Name')
    logger.info(dynamic['name'])
    msgid, correlid = putMessage()
    if msgid:
        awaitResponse(msgid, correlid)

    dynamic['queue'].close()

if (queue):
    queue.close()

if (qmgr):
    qmgr.disconnect()

logger.info("Application is closing")
