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
 * This program waits for a request message and then sends a reply.
 *
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include <cmqc.h>

#include "common.h"
#include "config.h"

static int openQueue(MQHCONN hConn, PMQHOBJ pHObj);
static int processRequests(MQHCONN, MQHOBJ);

#define WAIT_INTERVAL 10 // seconds to wait for a new request

// The only (optional) parameter to this program is the name of the configuration file
int main(int argc, char **argv) {
  int rc = 0;
  time_t now;
  MQHCONN hConn = MQHC_UNUSABLE_HCONN;
  MQHOBJ hObj = MQHO_UNUSABLE_HOBJ;

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
    rc = openQueue(hConn, &hObj);
  }

  if (rc == 0) {
    rc = processRequests(hConn, hObj);
  }

  if (hObj != MQHO_UNUSABLE_HOBJ) {
    closeQueue(hConn, &hObj);
  }

  if (hConn != MQHC_UNUSABLE_HCONN) {
    disconnectQMgr(&hConn);
  }

  printf("\nDone. Exit code:%d\n", rc);
  exit(rc);
}

/*
 * Open a queue for INPUT as we will be getting a message
 *
 * Return 0 if OK; -1 otherwise
 */
static int openQueue(MQHCONN hConn, PMQHOBJ pHObj) {
  MQLONG compCode;
  MQLONG reason;
  int rc = 0;

  MQOD mqod = {MQOD_DEFAULT};
  MQLONG options = MQOO_INPUT_EXCLUSIVE;

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
 * Read messages from the designated input queue.
 *
 * Do some processing on the message contents, and send a reply.
 * Use MQPUT1 for the reply operation, as that can be more efficient
 * than MQOPEN/MQPUT/MQCLOSE when the reply queue changes frequently: a
 * common situation with the request/response pattern.
 *
 * Various fields are copied from the input message descriptor to the reply
 * based on Report options that have been requested.
 *
 * Return 0 if OK; -1 otherwise
 */
static int processRequests(MQHCONN hConn, MQHOBJ hObj) {

  MQLONG compCode;
  MQLONG reason;
  int rc = 0;
  int ok = 1;
  int i;
  MQMD inMqmd = {MQMD_DEFAULT};
  MQMD outMqmd = {MQMD_DEFAULT};

  MQGMO mqgmo = {MQGMO_DEFAULT};
  MQPMO mqpmo = {MQPMO_DEFAULT};
  MQOD mqod = {MQOD_DEFAULT};
  char inBuffer[DEFAULT_BUFFER_LENGTH];
  char outBuffer[DEFAULT_BUFFER_LENGTH];

  MQLONG datalength;

  // Structure version must be high enough to recognise the MatchOptions field
  mqgmo.Version = MQGMO_VERSION_2;

  // Various options to control retrieval
  mqgmo.Options = MQGMO_NO_SYNCPOINT;
  mqgmo.Options |= MQGMO_FAIL_IF_QUIESCING;
  mqgmo.Options |= MQGMO_WAIT;
  mqgmo.Options |= MQGMO_CONVERT;

  mqgmo.Options |= MQGMO_ACCEPT_TRUNCATED_MSG; // Process the message even if it is too long for the buffer

  mqgmo.WaitInterval = WAIT_INTERVAL * 1000; // Convert seconds to milliseconds

  // Not going to try to match on MsgId or CorrelId
  mqgmo.MatchOptions = MQMO_NONE;

  // Loop until there are no more messages on the queue
  while (ok) {

    MQGET(hConn, hObj, &inMqmd, &mqgmo, sizeof(inBuffer), inBuffer, &datalength, &compCode, &reason);

    if (reason != MQRC_NONE) {
      printError("MQGET", compCode, reason);
    }

    if (reason == MQRC_NONE || reason == MQRC_TRUNCATED_MSG_ACCEPTED) {

      // Print the request message
      if (!strncmp(inMqmd.Format, MQFMT_STRING, MQ_FORMAT_LENGTH)) {
        printf("Request Message: %*.*s\n", datalength, datalength, inBuffer);
      } else {
        char title[32];
        sprintf(title, "Request Message Type:%*.*s", MQ_FORMAT_LENGTH, MQ_FORMAT_LENGTH, inMqmd.Format);
        dumpHex(title, inBuffer, datalength);
      }

      // Reverse the contents of the inbound message
      memset(outBuffer, 0, sizeof(outBuffer));
      for (i = 0; i < datalength; i++) {
        outBuffer[i] = inBuffer[datalength - i - 1];
      }

      // Set up the ReplyTo information
      strncpy(mqod.ObjectName, inMqmd.ReplyToQ, MQ_Q_NAME_LENGTH);
      strncpy(mqod.ObjectQMgrName, inMqmd.ReplyToQMgr, MQ_Q_MGR_NAME_LENGTH);
      mqod.ObjectType = MQOT_Q;

      // Options to control how the message is put
      mqpmo.Options = MQPMO_FAIL_IF_QUIESCING;
      mqpmo.Options |= MQPMO_NO_SYNCPOINT;

      // Extract the report options that tell us how to construct the reply message's correlators.
      // This value is a bit-field so we can use bitwise operations to test it.
      MQLONG ro = inMqmd.Report & (MQRO_COPY_MSG_ID_TO_CORREL_ID | MQRO_PASS_MSG_ID | MQRO_PASS_CORREL_ID | MQRO_NEW_MSG_ID);

      // The default behaviour is to copy the inbound MsgId into the outbound CorrelId and create a new MsgId
      if (ro & MQRO_COPY_MSG_ID_TO_CORREL_ID || ro & MQRO_NEW_MSG_ID || ro == 0) {
        memcpy(outMqmd.CorrelId, inMqmd.MsgId, MQ_CORREL_ID_LENGTH);
        mqpmo.Options |= MQPMO_NEW_MSG_ID;
      }
      // But there are options to allow a direct return of the MsgId and/or CorrelId
      if (ro & MQRO_PASS_MSG_ID) {
        memcpy(outMqmd.MsgId, inMqmd.MsgId, MQ_MSG_ID_LENGTH);
      }
      if (ro & MQRO_PASS_CORREL_ID) {
        memcpy(outMqmd.CorrelId, inMqmd.CorrelId, MQ_CORREL_ID_LENGTH);
      }

      // Also set report options that should be inherited
      if (inMqmd.Report & MQRO_PASS_DISCARD_AND_EXPIRY) {
        outMqmd.Expiry = inMqmd.Expiry;
        if (inMqmd.Report & MQRO_DISCARD_MSG) {
          outMqmd.Report = MQRO_DISCARD_MSG;
        } else {
          outMqmd.Report = MQRO_NONE;
        }
      } else {
        outMqmd.Report = MQRO_NONE;
      }

      // Set the reply message to be the same format and persistence as input
      memcpy(outMqmd.Format, inMqmd.Format, MQ_FORMAT_LENGTH);
      outMqmd.MsgType = MQMT_REPLY;
      outMqmd.Persistence = inMqmd.Persistence;

      // Send the reply, using MQPUT1
      MQPUT1(hConn, &mqod, &outMqmd, &mqpmo, datalength, outBuffer, &compCode, &reason);
      if (reason != MQRC_NONE) {
        printError("MQPUT1", compCode, reason);
      }
    } else {
      if (reason == MQRC_NO_MSG_AVAILABLE) {
        // This is not really an error but we do need to break from the loop
        ok = 0;
      } else {
        rc = -1;
        ok = 0;
      }
    }
  }

  return rc;
}
