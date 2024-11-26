/**
 * Copyright 2024 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

/* This is part of a demonstration showing a common request/reply pattern
 * using the C MQI.
 *
 * This program sends a request message and then waits for a reply from the responder.
 *
 * A temporary queue is used for the reply.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include <cmqc.h>

#include "common.h"
#include "config.h"

static int openRequestQueue(MQHCONN hConn, PMQHOBJ pHObj);
static int openReplyQueue(MQHCONN hConn, PMQHOBJ pHObj);

static int putRequestMessage(MQHCONN hConn, MQHOBJ hObj, char *msg);
static int getReplyMessage(MQHCONN hConn, MQHOBJ hObj);

static char replyToQ[MQ_Q_NAME_LENGTH] = {' '};
static char replyToQMgr[MQ_Q_MGR_NAME_LENGTH] = {' '};
static MQBYTE24 msgId = {MQMI_NONE_ARRAY};

#define WAIT_INTERVAL 2 // seconds to wait for a reply

// The only (optional) parameter to this program is the name of the configuration file
int main(int argc, char **argv) {
  int rc = 0;
  time_t now;
  MQHCONN hConn = MQHC_UNUSABLE_HCONN;
  MQHOBJ hObjRequest = MQHO_UNUSABLE_HOBJ;
  MQHOBJ hObjReply = MQHO_UNUSABLE_HOBJ;

  if (getenv(CONFIG_DEBUG)) {
    debug = 1;
  }

  char *configFile = getenv(CONFIG_JSON_FILE);
  if (argc > 1) {
    configFile = argv[1];
  }
  if (!configFile) {
    configFile = DEFAULT_CONFIG_FILE;
  }

  printf("Starting up Application: %s\n", argv[0]);
  rc = parseConfig(configFile);
  if (rc == 0) {
    rc = connectQMgr(&hConn);
  }

  if (rc == 0) {
    rc = openRequestQueue(hConn, &hObjRequest);
  }

  if (rc == 0) {
    rc = openReplyQueue(hConn, &hObjReply);
  }

  if (rc == 0) {
    char msgData[DEFAULT_BUFFER_LENGTH];
    time(&now);
    // ctime always returns a 26-byte buffer. But we want to strip off the trailing "\n" and NUL.
    // So force the buffer to use 24 chars.
    sprintf(msgData, "Hello from C at %24.24s", ctime(&now));
    rc = putRequestMessage(hConn, hObjRequest, msgData);
  }

  if (rc == 0) {
    rc = getReplyMessage(hConn, hObjReply);
  }

  if (hObjRequest != MQHO_UNUSABLE_HOBJ) {
    closeQueue(hConn, &hObjRequest);
  }

  if (hObjReply != MQHO_UNUSABLE_HOBJ) {
    closeQueue(hConn, &hObjReply);
  }

  if (hConn != MQHC_UNUSABLE_HCONN) {
    disconnectQMgr(&hConn);
  }

  printf("\nDone. Exit code:%d\n", rc);
  exit(rc);
}

/*
 * Open a queue for OUTPUT as we will be putting a message
 *
 * Return 0 if OK; -1 otherwise
 */
static int openRequestQueue(MQHCONN hConn, PMQHOBJ pHObj) {
  MQLONG compCode;
  MQLONG reason;
  int rc = 0;

  MQOD mqod = {MQOD_DEFAULT};
  MQLONG options = MQOO_OUTPUT;

  strncpy(mqod.ObjectName, mqEndpoints[0].queueName, MQ_Q_NAME_LENGTH);

  mqod.ObjectType = MQOT_Q;

  MQOPEN(hConn, &mqod, options, pHObj, &compCode, &reason);

  if (reason != MQRC_NONE) {
    printError("MQOPEN", compCode, reason);
    rc = -1;
  }

  return rc;
}

/*
 * Open a queue for INPUT from where we will get the reply message
 * Use a model queue, so that a temporary reply queue is created and
 * automatically destroyed when closed
 *
 * Return 0 if OK; -1 otherwise
 */
static int openReplyQueue(MQHCONN hConn, PMQHOBJ pHObj) {
  MQLONG compCode;
  MQLONG reason;
  int rc = 0;

  MQOD mqod = {MQOD_DEFAULT};
  MQLONG options = MQOO_INPUT_EXCLUSIVE;

  mqEndpoint_t ep = mqEndpoints[0];
  strncpy(mqod.ObjectName, ep.modelQueueName, MQ_Q_NAME_LENGTH);
  if (ep.dynamicQueuePrefix) {
    // The dynamic queue has its name start with this prefix
    strncpy(mqod.DynamicQName, ep.dynamicQueuePrefix, MQ_Q_NAME_LENGTH);
  }
  mqod.ObjectType = MQOT_Q;

  MQOPEN(hConn, &mqod, options, pHObj, &compCode, &reason);

  if (reason != MQRC_NONE) {
    printError("MQOPEN", compCode, reason);
    rc = -1;
  } else {
    // The name of the dynamically-created queue is now in the MQOD structure
    // Stash it, so we can tell the responder its name.
    strncpy(replyToQ, mqod.ObjectName, MQ_Q_NAME_LENGTH);
    strncpy(replyToQMgr, mqod.ObjectQMgrName, MQ_Q_MGR_NAME_LENGTH);
  }

  return rc;
}

/*
 * Put the message to the request queue.
 *
 * Return 0 if OK; -1 otherwise
 */
static int putRequestMessage(MQHCONN hConn, MQHOBJ hObj, char *msg) {
  MQLONG compCode;
  MQLONG reason;
  int rc = 0;
  MQMD mqmd = {MQMD_DEFAULT};
  MQPMO mqpmo = {MQPMO_DEFAULT};

  // Options to control how the message is put
  mqpmo.Options = MQPMO_FAIL_IF_QUIESCING;
  mqpmo.Options |= MQPMO_NO_SYNCPOINT;
  mqpmo.Options |= MQPMO_NEW_MSG_ID;

  // We are sending a character string. Set the format to indicate
  // that, so that the recipient can convert the codepage if necessary
  memcpy(mqmd.Format, MQFMT_STRING, MQ_FORMAT_LENGTH);

  strncpy(mqmd.ReplyToQ, replyToQ, MQ_Q_NAME_LENGTH);
  strncpy(mqmd.ReplyToQMgr, replyToQMgr, MQ_Q_MGR_NAME_LENGTH);
  mqmd.MsgType = MQMT_REQUEST;

  // We are using a temporary dynamic queue for the reply, which
  // can only accept non-persistent messages. So we force that on
  // the request message, expecting that the responder will copy it into the reply.
  mqmd.Persistence = MQPER_NOT_PERSISTENT;

  // Put the message to the queue
  MQPUT(hConn, hObj, &mqmd, &mqpmo, strlen(msg), msg, &compCode, &reason);
  memcpy(msgId, mqmd.MsgId, MQ_MSG_ID_LENGTH);
  if (reason != MQRC_NONE) {
    printError("MQPUT", compCode, reason);
    rc = -1;
  }

  return rc;
}

/*
 * Wait for the response message to appear, and retrieve it
 * Return 0 if OK; -1 otherwise
 */
static int getReplyMessage(MQHCONN hConn, MQHOBJ hObj) {

  MQLONG compCode;
  MQLONG reason;
  int rc = 0;
  MQMD mqmd = {MQMD_DEFAULT};
  MQGMO mqgmo = {MQGMO_DEFAULT};
  char buffer[DEFAULT_BUFFER_LENGTH];
  MQLONG datalength;

  // Structure version must be high enough to recognise the MatchOptions field
  mqgmo.Version = MQGMO_VERSION_2;

  // Options to control retrieval
  mqgmo.Options = MQGMO_NO_SYNCPOINT;
  mqgmo.Options |= MQGMO_FAIL_IF_QUIESCING;
  mqgmo.Options |= MQGMO_WAIT;
  mqgmo.Options |= MQGMO_CONVERT;

  mqgmo.Options |= MQGMO_ACCEPT_TRUNCATED_MSG; // Process the message even if it is too long for the buffer

  mqgmo.WaitInterval = WAIT_INTERVAL * 1000; // Convert seconds to milliseconds

  // Wait for a message that matches the original request. Default behaviour for a responder is to copy
  // the original MsgId into the CorrelId, so we put that into the MQGET options
  mqgmo.MatchOptions = MQMO_MATCH_CORREL_ID;
  memcpy(mqmd.CorrelId, msgId, MQ_CORREL_ID_LENGTH);

  MQGET(hConn, hObj, &mqmd, &mqgmo, sizeof(buffer), buffer, &datalength, &compCode, &reason);

  if (reason == MQRC_NONE) {
    if (!strncmp(mqmd.Format, MQFMT_STRING, MQ_FORMAT_LENGTH)) {
      printf("Reply   Message: %*.*s\n", datalength, datalength, buffer);
    } else {
      char title[32];
      sprintf(title, "Reply   Message Type:%*.*s", MQ_FORMAT_LENGTH, MQ_FORMAT_LENGTH, mqmd.Format);
      dumpHex(title, buffer, datalength);
    }
  } else {
    printError("MQGET", compCode, reason);
    rc = -1;
  }

  return rc;
}
