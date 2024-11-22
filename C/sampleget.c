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

/* This is a demonstration showing the GET operations from an MQ Queue
 * using the MQI C interface.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include <cmqc.h>

#include "common.h"
#include "config.h"

static int openQueue(MQHCONN hConn, PMQHOBJ pHObj);
static int getMessages(MQHCONN hConn, MQHOBJ hObj);

// The only (optional) parameter to this program is the name of the
// configuration file
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
    rc = getMessages(hConn, hObj);
  }

  if (hObj != MQHO_UNUSABLE_HOBJ) {
    closeQueue(hConn, &hObj);
  }

  if (hConn != MQHC_UNUSABLE_HCONN) {
    disconnectQMgr(&hConn);
  }

  printf("Done. Exit code:%d\n", rc);
  exit(rc);
}

/*
 * Open a queue for INPUT as we will be getting messages
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
 * Get all available messages from the queue, printing the contents.
 * Return 0 if OK; -1 otherwise
 */
static int getMessages(MQHCONN hConn, MQHOBJ hObj) {

  MQLONG compCode;
  MQLONG reason;
  int rc = 0;
  int ok = 1;
  MQMD mqmd = {MQMD_DEFAULT};
  MQGMO mqgmo = {MQGMO_DEFAULT};
  char buffer[DEFAULT_BUFFER_LENGTH];
  MQLONG datalength;

  // Structure version must be high enough to recognise the MatchOptions field
  mqgmo.Version = MQGMO_VERSION_2;

  // Various options to control retrieval
  mqgmo.Options = MQGMO_NO_SYNCPOINT;
  mqgmo.Options |= MQGMO_FAIL_IF_QUIESCING;
  mqgmo.Options |= MQGMO_NO_WAIT;
  mqgmo.Options |= MQGMO_CONVERT;

  mqgmo.Options |= MQGMO_ACCEPT_TRUNCATED_MSG; // Process the message even if it
                                               // is too long for the buffer

  // Not going to try to match on MsgId or CorrelId
  mqgmo.MatchOptions = MQMO_NONE;

  // Loop until there are no more messages on the queue
  while (ok) {

    MQGET(hConn, hObj, &mqmd, &mqgmo, sizeof(buffer), buffer, &datalength,
          &compCode, &reason);

    if (reason == MQRC_NONE) {
      if (!strncmp(mqmd.Format, MQFMT_STRING, MQ_FORMAT_LENGTH)) {
        printf("Message: %*.*s\n", datalength, datalength, buffer);
      } else {
        char title[32];
        sprintf(title, "Message Type:%*.*s", MQ_FORMAT_LENGTH, MQ_FORMAT_LENGTH,
                mqmd.Format);
        dumpHex(title, buffer, datalength);
      }
    } else {
      printError("MQGET", compCode, reason);
      switch (reason) {
      case MQRC_NO_MSG_AVAILABLE:
        // This is not really an error but we do need to break from the loop
        ok = 0;
        break;
      case MQRC_TRUNCATED_MSG_ACCEPTED:
        // Carry on if there are more messages
        break;
      default:
        rc = -1;
        ok = 0;
        break;
      }
    }
  }

  return rc;
}
