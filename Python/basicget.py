"""Example of getting a message from an IBM MQ queue
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

import logging

import ibmmq as mq
from utils.env import EnvStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WAIT_INTERVAL = 5  # Seconds

def connect(index):
    """ Establish connection to MQ Queue Manager """
    logger.info('Establishing Connection with MQ Server')

    # Set credentials if they have been provided
    csp = mq.CSP()
    csp.CSPUserId = EnvStore.getenv_value(EnvStore.APP_USER, index)
    csp.CSPPassword = EnvStore.getenv_value(EnvStore.APP_PASSWORD, index)
    if csp.CSPUserId is None:
        csp = None

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
        qmgr.connect_with_options(MQDetails[EnvStore.QMGR],
                                  csp=csp,
                                  cd=cd, sco=sco)
        return qmgr
    except mq.MQMIError as e:
        logger.error('Error connecting: %s', e)
        return None

def get_queue():
    """Establish access to a Queue"""
    logger.info('Opening a Queue')
    try:
        q = mq.Queue(qmgr)

        od = mq.OD()
        od.ObjectName = MQDetails[EnvStore.QUEUE_NAME]

        open_options = mq.CMQC.MQOO_INPUT_AS_Q_DEF
        q.open(od, open_options)

        return q
    except mq.MQMIError as e:
        logger.error('Error opening queue: %s', e)
        return None

def get_messages():
    """Get messages from the queue"""
    logger.info('Attempting gets from Queue')

    # Message Descriptor
    md = mq.MD()

    # Get Message Options
    # MQGMO_NO_PROPERTIES indicates that JMS headers are to be stripped
    # off the message during the get. This can also be done by calling
    # get_no_jms() on the queue instead of get().
    gmo = mq.GMO()
    gmo.Options = (mq.CMQC.MQGMO_WAIT |
                   mq.CMQC.MQGMO_FAIL_IF_QUIESCING |
                   mq.CMQC.MQGMO_NO_PROPERTIES)

    gmo.WaitInterval = WAIT_INTERVAL * 1000  # Convert to milliseconds

    keep_running = True
    while keep_running:
        try:
            # Reset the MsgId, CorrelId & GroupId so that we can reuse
            # the same 'md' object again.
            md.MsgId = mq.CMQC.MQMI_NONE
            md.CorrelId = mq.CMQC.MQCI_NONE
            md.GroupId = mq.CMQC.MQGI_NONE

            # Wait up to to gmo.WaitInterval for a new message.
            # message = queue.get_no_jms(None, md, gmo)
            message = queue.get(None, md, gmo)

            # Process the message here..
            logger.info('Have message from input queue: %s', message.decode())

        except mq.MQMIError as e:
            if e.comp == mq.CMQC.MQCC_FAILED and e.reason == mq.CMQC.MQRC_NO_MSG_AVAILABLE:
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

def build_mq_details(index):
    """Create the connection details for the queue manager"""
    for key in [EnvStore.QMGR, EnvStore.QUEUE_NAME, EnvStore.CHANNEL, EnvStore.HOST,
                EnvStore.PORT, EnvStore.KEY_REPOSITORY, EnvStore.CIPHER]:
        MQDetails[key] = EnvStore.getenv_value(key, index)

# Application logic starts here
logger.info('Application "BasicGet" is starting')

envStore = EnvStore()
envStore.set_env()

MQDetails = {}

qmgr = None
queue = None

numEndPoints = envStore.get_endpoint_count()
logger.info('There are %d connections', numEndPoints)

# Loop through the connection options. If one succeeds, do the
# work and then quit.
for index, conn_info in envStore.get_next_connection_string():
    logger.info('Using Connection String %s', conn_info)

    build_mq_details(index)

    qmgr = connect(index)
    if qmgr is not None:
        queue = get_queue()
        if queue is not None:
            get_messages()
            queue.close()

        qmgr.disconnect()
        break

MQDetails.clear()

logger.info('Application is ending')
