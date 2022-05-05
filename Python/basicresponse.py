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

# function to establish connection to Queue


def getQueue(queueName, forInput):
    logger.info('Connecting to Queue')
    try:
        # Works with single call, but object Descriptor
        # provides other options
        # q = pymqi.Queue(qmgr, MQDetails[EnvStore.QUEUE_NAME])
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
    gmo.Options = pymqi.CMQC.MQGMO_WAIT | pymqi.CMQC.MQGMO_FAIL_IF_QUIESCING | pymqi.CMQC.MQGMO_SYNCPOINT
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
            message = queue.get(None, md, gmo)

            # Process the message here..
            msgObject = json.loads(message.decode())
            logger.info('Have message from Queue')
            logger.info(msgObject)

            respondToRequest(md, msgObject)
            # logger.info("committing message")
            # qmgr.commit()
            # logger.info("committed message")

        except pymqi.MQMIError as e:
            if e.comp == pymqi.CMQC.MQCC_FAILED and e.reason == pymqi.CMQC.MQRC_NO_MSG_AVAILABLE:
                print("QM is empty")
                # No messages, that's OK, we can ignore it.
                pass
            else:
                # Some other error condition.
                qmgr.backout()
                logger.log(e)
                raise

        except (UnicodeDecodeError, ValueError) as e:
            logger.info('Message is not valid json')
            logger.info(e)
            logger.info(message)
            continue

        except KeyboardInterrupt:
            logger.info('Have received a keyboard interrupt')
            keep_running = False


def respondToRequest(md, msgObject):
    # Create a response message descriptor with the CorrelId
    # set to the value of MsgId of the original request message.
    response_md = pymqi.MD()
    response_md.CorrelId = md.CorrelId
    response_md.MsgId = md.MsgId
    response_md.Format = pymqi.CMQC.MQFMT_STRING
    
    try:
        msgReply = {
            'Greeting': "Reply from Python! " + str(datetime.datetime.now()),
            'value': random.randint(1, 101)
        }

        replyQueue = getQueue(md.ReplyToQ, False)
        if (msgObject['value']):
            msgReply['value'] = performCalc(msgObject['value'])
        #replyQueue.put(str(json.dumps(msgReply)),response_md )
        qmgr.commit()
        replyQueue.put(EnvStore.stringForVersion(
            json.dumps(msgReply)), response_md)

    except Exception as e:
        qmgr.backout()
        logger.exception(e)
    finally:
        replyQueue.close()


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
    for key in [EnvStore.QMGR, EnvStore.QUEUE_NAME, EnvStore.CHANNEL, EnvStore.HOST,
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
queue = None

qmgr = connect()
if (qmgr):
    queue = getQueue(MQDetails[EnvStore.QUEUE_NAME], True)
if (queue):
    getMessages()
    queue.close()

if (qmgr):
    qmgr.disconnect()

logger.info("Application is closing")
