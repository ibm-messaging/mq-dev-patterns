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
        cd = None
        if not EnvStore.ccdtCheck():
            logger.info('CCDT URL export is not set, will be using json envrionment client connections settings')

            cd = pymqi.CD(Version=pymqi.CMQXC.MQCD_VERSION_11)
            cd.ChannelName = MQDetails[EnvStore.CHANNEL]
            cd.ConnectionName = conn_info
            cd.ChannelType = pymqi.CMQC.MQCHT_CLNTCONN
            cd.TransportType = pymqi.CMQC.MQXPT_TCP

            logger.info('Checking Cypher details')
            # If a cipher is set then set the TLS settings
            if MQDetails[EnvStore.CIPHER]:
                logger.info('Making use of Cypher details')
                cd.SSLCipherSpec = MQDetails[EnvStore.CIPHER]

        # Key repository is not specified in CCDT so look in envrionment settings
        # Create an empty SCO object
        sco = pymqi.SCO()
        if MQDetails[EnvStore.KEY_REPOSITORY]:
            logger.info('Setting Key repository')
            sco.KeyRepository = MQDetails[EnvStore.KEY_REPOSITORY]

        #options = pymqi.CMQC.MQPMO_NO_SYNCPOINT | pymqi.CMQC.MQPMO_NEW_MSG_ID | pymqi.CMQC.MQPMO_NEW_CORREL_ID
        options = pymqi.CMQC.MQPMO_NEW_CORREL_ID

        qmgr = pymqi.QueueManager(None)
        qmgr.connect_with_options(MQDetails[EnvStore.QMGR],
                                  user=credentials[EnvStore.USER],
                                  password=credentials[EnvStore.PASSWORD],
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
        sub_desc.set_vs("ObjectString", MQDetails[EnvStore.TOPIC_NAME])

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
        pymqi.CMQC.MQGMO_WAIT + \
        pymqi.CMQC.MQGMO_NO_PROPERTIES

    gmo = pymqi.GMO(Options=subOptions)
    gmo["WaitInterval"] = 30 * 1000

    # Message Descriptor
    md = pymqi.MD()

    keep_running = True
    while keep_running:
        try:
            # Reset the MsgId, CorrelId & GroupId so that we can reuse
            # the same 'md' object again.
            md.MsgId = pymqi.CMQC.MQMI_NONE
            md.CorrelId = pymqi.CMQC.MQCI_NONE
            md.GroupId = pymqi.CMQC.MQGI_NONE

            #message = subscription.get(None, pymqi.md(), gmo)
            message = subscription.get(None, md, gmo)

            # Process the message here..
            msgObject = json.loads(message.decode())
            logger.info('Have message from Queue')
            logger.info(msgObject)

        except pymqi.MQMIError as e:
            if e.comp == pymqi.CMQC.MQCC_FAILED and e.reason == pymqi.CMQC.MQRC_NO_MSG_AVAILABLE:
                # No messages, that's OK, we can ignore it.
                pass
            else:
                # Some other error condition.
                raise

        except (UnicodeDecodeError, ValueError)  as e:
            logger.info('Message is not valid json')
            logger.info(e)
            logger.info(message)
            continue

        except KeyboardInterrupt:
            logger.info('Have received a keyboard interrupt')
            keep_running = False


def buildMQDetails():
    for key in [EnvStore.QMGR, EnvStore.TOPIC_NAME, EnvStore.CHANNEL, EnvStore.HOST,
                EnvStore.PORT, EnvStore.KEY_REPOSITORY, EnvStore.CIPHER]:
        MQDetails[key] = EnvStore.getEnvValue(key)


# Application Logic starts here
logger.info("Application is Starting")

envStore = EnvStore()
envStore.setEnv()

MQDetails = {}
credentials = {
    EnvStore.USER: EnvStore.getEnvValue(EnvStore.APP_USER),
    EnvStore.PASSWORD: EnvStore.getEnvValue(EnvStore.APP_PASSWORD)
}

buildMQDetails()

logger.info('Credentials are set')
#logger.info(credentials)

#conn_info = "%s(%s)" % (MQDetails[EnvStore.HOST], MQDetails[EnvStore.PORT])
conn_info = EnvStore.getConnection(EnvStore.HOST, EnvStore.PORT)

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
