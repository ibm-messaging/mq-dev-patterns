"""Example of subscribing to an IBM MQ topic.
"""
# -*- coding: utf-8 -*-
# Copyright 2019,2025 IBM
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

import logging

import ibmmq as mq

from utils.env import EnvStore

WAIT_INTERVAL = 5 # seconds

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def connect():
    """Establish connection to the queue manager"""
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
        qmgr.connect_with_options(MQDetails[EnvStore.QMGR],
                                  user=credentials[EnvStore.USER],
                                  password=credentials[EnvStore.PASSWORD],
                                  cd=cd, sco=sco)
        return qmgr
    except mq.MQMIError as e:
        logger.error("Error connecting")
        logger.error(e)
        return None

def get_subscription():
    """Get access to the topic via a subscription.
    Using a MANAGED subscription means that the queue manager will create and
    return the queue to which publications are delivered.
    """
    logger.info('Creating Subscription')
    try:
        sub_desc = mq.SD()
        sub_desc.Options = mq.CMQC.MQSO_CREATE + mq.CMQC.MQSO_MANAGED
        sub_desc.set_vs("ObjectString", MQDetails[EnvStore.TOPIC_NAME])

        sub = mq.Subscription(qmgr)
        sub.sub(sub_desc=sub_desc)
        return sub
    except mq.MQMIError as e:
        logger.error("Error opening queue")
        logger.error(e)
        return None

def get_messages():
    """Get publications from the subscription queue"""
    logger.info('Attempting gets from Subscription')

    get_options = mq.CMQC.MQGMO_NO_SYNCPOINT + \
        mq.CMQC.MQGMO_FAIL_IF_QUIESCING + \
        mq.CMQC.MQGMO_WAIT + \
        mq.CMQC.MQGMO_NO_PROPERTIES

    gmo = mq.GMO(Options=get_options)
    gmo.WaitInterval = WAIT_INTERVAL * 1000 # convert to milliseconds

    # Message Descriptor
    md = mq.MD()

    keep_running = True
    while keep_running:
        try:
            # Reset the MsgId, CorrelId & GroupId so that we can reuse
            # the same 'md' object again.
            md.MsgId = mq.CMQC.MQMI_NONE
            md.CorrelId = mq.CMQC.MQCI_NONE
            md.GroupId = mq.CMQC.MQGI_NONE

            message = subscription.get(None, md, gmo)

            # Process the message here..
            logger.info('Have publication on topic: %s', message.decode())

        except mq.MQMIError as e:
            if e.comp == mq.CMQC.MQCC_FAILED and e.reason == mq.CMQC.MQRC_NO_MSG_AVAILABLE:
                # No messages, that's OK, we can just exit
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


def build_mq_details():
    """Create the connection details for the queue manager"""
    for key in [EnvStore.QMGR, EnvStore.TOPIC_NAME, EnvStore.CHANNEL, EnvStore.HOST,
                EnvStore.PORT, EnvStore.KEY_REPOSITORY, EnvStore.CIPHER]:
        MQDetails[key] = EnvStore.getenv_value(key)


# Application Logic starts here
logger.info("Application 'BasicSubscribe' is starting")

envStore = EnvStore()
envStore.set_env()

MQDetails = {}
credentials = {
    EnvStore.USER: EnvStore.getenv_value(EnvStore.APP_USER),
    EnvStore.PASSWORD: EnvStore.getenv_value(EnvStore.APP_PASSWORD)
}

build_mq_details()

logger.info('Credentials are set')
conn_info = EnvStore.get_connection(EnvStore.HOST, EnvStore.PORT)

qmgr = None
subscription = None

qmgr = connect()
if qmgr is not None:
    subscription = get_subscription()
if subscription is not None:
    get_messages()
    subscription.close(close_sub_queue=True)

if qmgr is not None:
    qmgr.disconnect()

logger.info("Application is ending")
