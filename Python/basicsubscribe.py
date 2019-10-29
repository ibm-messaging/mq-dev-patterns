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

# function to establish connection to Topic


def getSubscription():
    logger.info('Connecting to Subscription')
    try:
        sub_desc = pymqi.SD()
        sub_desc["Options"] = pymqi.CMQC.MQSO_CREATE + pymqi.CMQC.MQSO_RESUME + \
            pymqi.CMQC.MQSO_DURABLE + pymqi.CMQC.MQSO_MANAGED
        sub_desc.set_vs("SubName", "MySub")
        sub_desc.set_vs("ObjectString", MQDetails['TOPIC_NAME'])

        sub = pymqi.Subscription(qmgr)
        sub.sub(sub_desc=sub_desc)
        return sub
    except pymqi.MQMIError as e:
        logger.error("Error getting queue")
        logger.error(e)
        return None

# function to get messages from subscription


def getMessages():
    logger.info('Attempting gets from Subscription')

    subOptions = pymqi.CMQC.MQGMO_NO_SYNCPOINT + \
        pymqi.CMQC.MQGMO_FAIL_IF_QUIESCING + \
        pymqi.CMQC.MQGMO_WAIT
    gmo = pymqi.GMO(Options=subOptions)
    gmo["WaitInterval"] = 30 * 1000

    # Message Descriptor
    md = pymqi.MD()

    keep_running = True
    while keep_running:
        try:
            #message = subscription.get(None, pymqi.md(), gmo)
            message = subscription.get(None, md, gmo)

            # Process the message here..
            msgObject = json.loads(message.decode())
            logger.info('Have message from Queue')
            logger.info(msgObject)

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


def buildMQDetails():
    for key in ['QMGR', 'TOPIC_NAME', 'CHANNEL', 'HOST',
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
conn_info = EnvStore.getConnection('HOST', 'PORT')

qmgr = None
subscription = None

qmgr = connect()
if (qmgr):
    subscription = getSubscription()
if (subscription):
    getMessages()
    subscription.close(
        sub_close_options=pymqi.CMQC.MQCO_KEEP_SUB, close_sub_queue=True)

if (qmgr):
    qmgr.disconnect()

logger.info("Application is closing")
