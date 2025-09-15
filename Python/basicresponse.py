"""Example of using the request/response pattern with IBM MQ.
This is the responding part.
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
import math
import logging

import ibmmq as mq

from utils.env import EnvStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('Rsp')

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
        qmgr.connect_with_options(MQDetails[EnvStore.QMGR],
                                  csp=csp,
                                  cd=cd, sco=sco)
        return qmgr
    except mq.MQMIError as e:
        logger.error('Error connecting: %s', e)
        return None

def get_queue(queue_name):
    """Access the input queue"""

    logger.info('Opening queue')
    try:
        q = mq.Queue(qmgr)
        od = mq.OD()
        od.ObjectName = queue_name
        open_options = mq.CMQC.MQOO_INPUT_AS_Q_DEF

        q.open(od, open_options)
        return q

    except mq.MQMIError as e:
        logger.error('Error opening queue: %s', e)
        return None

def get_messages(qmgr):
    """Get messages from the input queue"""
    logger.info('Attempting gets from queue')

    # Get Message Options
    gmo = mq.GMO()

    # Use the SYNCPOINT option so that any inbound request is in the same transaction as the
    # response message
    gmo.Options = mq.CMQC.MQGMO_WAIT | mq.CMQC.MQGMO_FAIL_IF_QUIESCING | mq.CMQC.MQGMO_SYNCPOINT
    gmo.WaitInterval = WAIT_INTERVAL * 1000  # convert to milliseconds

    keep_running = True
    ok = True

    while keep_running and ok:
        backout_counter = 0
        msg_object = None

        md = mq.MD()

        try:
            # Reset the MsgId, CorrelId & GroupId so that we can reuse
            # the same 'md' object again.
            md.MsgId = mq.CMQC.MQMI_NONE
            md.CorrelId = mq.CMQC.MQCI_NONE
            md.GroupId = mq.CMQC.MQGI_NONE

            # Wait up to to gmo.WaitInterval for a new message.
            message = queue.get(None, md, gmo)
            backout_counter = md.BackoutCount

            # Process the message here..
            msg_object = json.loads(message.decode())
            logger.info('Have message from input queue: %s', message.decode())
            ok = respond_to_request(md, msg_object)

        except mq.MQMIError as e:
            if e.comp == mq.CMQC.MQCC_FAILED and e.reason == mq.CMQC.MQRC_NO_MSG_AVAILABLE:
                # No messages, that's OK, but we will now end the program. Might want to
                # keep running forever in a real application, but for this sample, we will
                # now give up.
                keep_running = False
                ok = False
            else:
                # Some other error condition.
                ok = False

        except (UnicodeDecodeError, ValueError) as e:
            logger.info('Message is not valid json')
            logger.info(e)
            logger.info(message)
            ok = False

        except KeyboardInterrupt:
            logger.info('Have received a keyboard interrupt')
            keep_running = False

        if ok:
            # Committing the GET and PUT as part of the same transaction
            qmgr.commit()
        else:
            keep_running = rollback(qmgr, md, msg_object, backout_counter)

def rollback(qmgr, md, msg, backout_counter):
    """Deal with a problem processing the message.
    If there have been multiple attempts at processing the same message,
    send it to a separate backout queue.
    """
    # Get the backout queue from the Environment. In a production
    # system, you would probably find the backout queue from the BOQNAME attribute
    # of the input queue. But for simplicity here, we're reading it from an external
    # configuration.
    backout_queue = MQDetails[EnvStore.BACKOUT_QUEUE]

    ok = False
    pmo = mq.PMO()
    pmo.Options = mq.CMQC.MQPMO_SYNCPOINT

    # if the backout counter is greater than 5,
    # handle possible poisoned message scenario by redirecting the
    # the message to another queue.
    if backout_counter >= 5:
        logger.info('Poison message detected!')

        try:
            msg = backout_queue.stringForVersion(json.dumps(msg))
            qmgr.put1(backout_queue, msg, md, pmo)
            qmgr.commit()
            ok = True
            logger.info('Message sent to the backout queue: %s', str(backout_queue))
        except mq.MQMIError as e:
            logger.info('Error on redirecting the message : %s', e)
            ok = False

    else:
        try:
            qmgr.backout()
            ok = True
        except mq.MQMIError as e:
            logger.error('Error on rollback: %s', e)
            ok = False

    return ok

def respond_to_request(in_md, msg_object):
    """Repond to the request.
    Set correlators based on the inbound request's report options
    """
    out_md = mq.MD()
    pmo = mq.PMO()

    # Make the response part of the same transaction as the request
    pmo.Options |= mq.CMQC.MQPMO_SYNCPOINT

    od = mq.OD()

    # This value is a bit-field so we can use bitwise operations to test it.
    ro = in_md.Report & (mq.CMQC.MQRO_COPY_MSG_ID_TO_CORREL_ID |
                         mq.CMQC.MQRO_PASS_MSG_ID |
                         mq.CMQC.MQRO_PASS_CORREL_ID |
                         mq.CMQC.MQRO_NEW_MSG_ID)

    # The default behaviour is to copy the inbound MsgId into the outbound CorrelId and create a new MsgId
    if (ro & mq.CMQC.MQRO_COPY_MSG_ID_TO_CORREL_ID != 0) or (ro & mq.CMQC.MQRO_NEW_MSG_ID != 0) or ro == 0:
        out_md.CorrelId = in_md.MsgId
        pmo.Options |= mq.CMQC.MQPMO_NEW_MSG_ID

    # But there are options to allow a direct return of the MsgId and/or CorrelId
    if ro & mq.CMQC.MQRO_PASS_MSG_ID != 0:
        out_md.MsgId = in_md.MsgId

    if ro & mq.CMQC.MQRO_PASS_CORREL_ID != 0:
        out_md.CorrelId = in_md.CorrelId

    # Also set report options that should be inherited
    if in_md.Report & mq.CMQC.MQRO_PASS_DISCARD_AND_EXPIRY != 0:
        out_md.Expiry = in_md.Expiry
        if in_md.Report & mq.CMQC.MQRO_DISCARD_MSG != 0:
            out_md.Report = mq.CMQC.MQRO_DISCARD_MSG
        else:
            out_md.Report = mq.CMQC.MQRO_NONE
    else:
        out_md.Report = mq.CMQC.MQRO_NONE

    # Set the reply message to be the same persistence as input
    out_md.MsgType = mq.CMQC.MQMT_REPLY
    out_md.Persistence = in_md.Persistence
    out_md.Format = in_md.Format

    msg_reply = {
        'Greeting': 'Reply from Python! ' + str(datetime.datetime.now()),
        'value': random.randint(1, 101)
    }

    if msg_object['value'] is not None:
        msg_reply['value'] = perform_calc(msg_object['value'])

    od.ObjectName = in_md.ReplyToQ
    od.ObjectQMgrName = in_md.ReplyToQMgr

    try:
        qmgr.put1(od, str(json.dumps(msg_reply)), out_md, pmo)
        return True
    except mq.MQMIError as e:
        # Returning False will cause the calling function to backout the operation
        logger.error('Error putting message to reply queue: %s', e)
        return False

def perform_calc(n):
    """Do something with the input value to show that it has been processed"""
    sq_root = math.floor(math.sqrt(n))
    a = []
    i = 2
    j = 1

    while i <= sq_root <= n:
        if 0 == n % i:
            a.append(i)
            n /= i
        else:
            j = 2 if i > 2 else 1
            i += j
    return a

def build_mq_details():
    """Create the connection details for the queue manager"""
    for key in [EnvStore.QMGR, EnvStore.QUEUE_NAME, EnvStore.CHANNEL, EnvStore.HOST,
                EnvStore.PORT, EnvStore.KEY_REPOSITORY, EnvStore.CIPHER, EnvStore.BACKOUT_QUEUE]:
        MQDetails[key] = EnvStore.getenv_value(key)


# Application Logic starts here
logger.info('Application "BasicResponse" is starting')

envStore = EnvStore()
envStore.set_env()

MQDetails = {}
build_mq_details()

conn_info = EnvStore.get_connection(EnvStore.HOST, EnvStore.PORT)

qmgr = None
queue = None

qmgr = connect()
if qmgr is not None:
    queue = get_queue(MQDetails[EnvStore.QUEUE_NAME])

if queue is not None:
    get_messages(qmgr)

    queue.close()

if qmgr is not None:
    qmgr.disconnect()

logger.info('Application is ending')
