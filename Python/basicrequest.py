"""Example of using the request/response pattern with IBM MQ.
This is the requesting part.
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
import random
import logging

import ibmmq as mq

from utils.env import EnvStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WAIT_INTERVAL = 5  # seconds

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

        # Set credentials
        csp = mq.CSP()
        csp.CSPUserId = EnvStore.getenv_value(EnvStore.APP_USER)
        csp.CSPPassword = EnvStore.getenv_value(EnvStore.APP_PASSWORD)
        if csp.CSPUserId is None:
            csp = None

        qmgr = mq.QueueManager(None)
        qmgr.connect_with_options(MQDetails[EnvStore.QMGR], csp=csp,
                                  cd=cd, sco=sco)
        return qmgr
    except mq.MQMIError as e:
        logger.error('Error connecting: %s', e)
        return None

def get_queue():
    """Establish access to a Queue"""

    logger.info('Opening queue')
    try:
        q = mq.Queue(qmgr)

        od = mq.OD()
        od.ObjectName = MQDetails[EnvStore.QUEUE_NAME]
        q.open(od, mq.CMQC.MQOO_OUTPUT)
        logger.info('Opened queue %s', str(MQDetails[EnvStore.QUEUE_NAME]))
        return q

    except mq.MQMIError as e:
        logger.error('Error opening queue: %s', e)
        return None

def get_dynamic_queue():
    """create a Dynamic queue, used for replies, by opening a Model queue"""
    logger.info('Opening model queue')
    try:
        # Model queue's object descriptor.
        od = mq.OD()
        od.ObjectName = MQDetails[EnvStore.MODEL_QUEUE_NAME]
        od.DynamicQName = MQDetails[EnvStore.DYNAMIC_QUEUE_PREFIX]

        # Open the dynamic queue.
        open_options = mq.CMQC.MQOO_INPUT_EXCLUSIVE
        dynamic_queue_object = mq.Queue(qmgr, od, open_options)

        dynamic_queue_name = od.ObjectName.strip()
        logger.info('Created dynamic queue called %s', dynamic_queue_name)

        return dynamic_queue_object, dynamic_queue_name

    except mq.MQMIError as e:
        logger.error('Error opening queue: %s', e)
        return None

def put_message():
    """Put message onto queue"""

    logger.info('Attempting put to queue')
    try:
        # Prepare a Message Descriptor for the request message.
        # Set the ReplyToQ as the dynamic queue we just created
        md = mq.MD()
        md.ReplyToQ = dynamic['name']
        md.MsgType = mq.CMQC.MQMT_REQUEST
        md.Format = mq.CMQC.MQFMT_STRING

        # Tell the responder how to set correlators
        report_options = mq.CMQC.MQRO_COPY_MSG_ID_TO_CORREL_ID
        md.ReportOptions = report_options

        # Send the message
        msg = str(json.dumps(msg_object))
        queue.put(msg, md)

        logger.info('Put message successful: %s', msg)
        return md.MsgId

    except mq.MQMIError as e:
        logger.error('Error in put to queue: %s', e)

    return None

def await_response(msgid):
    """Wait for a response on the replyToQ.
    Use the CorrelId to ensure it corresponds to the original request.
    """
    logger.info('Attempting get from Reply Queue')

    # Message Descriptor
    md = mq.MD()
    # Set the field we are using to connect the reply to the request based on
    # the request's ReportOptions
    md.CorrelId = msgid

    # Get Message Options
    gmo = mq.GMO()
    gmo.Options = (mq.CMQC.MQGMO_WAIT |
                   mq.CMQC.MQGMO_FAIL_IF_QUIESCING |
                   mq.CMQC.MQGMO_NO_PROPERTIES)
    gmo.WaitInterval = WAIT_INTERVAL * 1000  # Convert to milliseconds
    gmo.MatchOptions = mq.CMQC.MQMO_MATCH_CORREL_ID
    gmo.Version = mq.CMQC.MQGMO_VERSION_2

    keep_running = True
    while keep_running:
        try:
            # Wait up to to gmo.WaitInterval for a new message.
            message = dynamic['queue'].get(None, md, gmo)

            # Process the message here..
            logger.info('Have message from reply queue: %s', message.decode())

            # Not expecting any more messages
            keep_running = False

        except mq.MQMIError as e:
            if e.comp == mq.CMQC.MQCC_FAILED and e.reason == mq.CMQC.MQRC_NO_MSG_AVAILABLE:
                # No messages, that's OK, we can ignore it.
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
    for key in [EnvStore.QMGR, EnvStore.QUEUE_NAME, EnvStore.CHANNEL, EnvStore.HOST,
                EnvStore.PORT, EnvStore.MODEL_QUEUE_NAME, EnvStore.DYNAMIC_QUEUE_PREFIX,
                EnvStore.KEY_REPOSITORY, EnvStore.CIPHER]:
        MQDetails[key] = EnvStore.getenv_value(key)


# Application Logic starts here
logger.info('Application "BasicRequest" is starting')

envStore = EnvStore()
envStore.set_env()

MQDetails = {}

build_mq_details()

conn_info = EnvStore.get_connection(EnvStore.HOST, EnvStore.PORT)

msg_object = {
    'Greeting': 'Hello from Python! ' + str(datetime.datetime.now()),
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
if qmgr is not None:
    queue = get_queue()

if queue is not None:
    dynamic['queue'], dynamic['name'] = get_dynamic_queue()

if dynamic['queue'] is not None:
    msgid = put_message()
    if msgid:
        await_response(msgid)

    dynamic['queue'].close()

if queue is not None:
    queue.close()

if qmgr is not None:
    qmgr.disconnect()

logger.info('Application is ending')
