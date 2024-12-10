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

static int subscribeTopic(MQHCONN hConn, PMQHOBJ pTopicHObj, PMQHOBJ pQueueHObj);
static int getMessages(MQHCONN hConn, MQHOBJ hObj);

#define DEFAULT_WAIT_INTERVAL 10 // Seconds to wait for more publications

// The only (optional) parameter to this program is the name of the configuration file
int main(int argc, char **argv) {
  int rc = 0;
  time_t now;
  MQHCONN hConn = MQHC_UNUSABLE_HCONN;
  MQHOBJ topicHObj = MQHO_UNUSABLE_HOBJ;
  MQHOBJ queueHObj = MQHO_UNUSABLE_HOBJ;

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
    rc = subscribeTopic(hConn, &topicHObj, &queueHObj);
  }
  if (rc == 0) {
    rc = getMessages(hConn, queueHObj);
  }

  if (queueHObj != MQHO_UNUSABLE_HOBJ) {
    closeQueue(hConn, &queueHObj);
  }

  if (topicHObj != MQHO_UNUSABLE_HOBJ) {
    closeQueue(hConn, &topicHObj);
  }

  if (hConn != MQHC_UNUSABLE_HCONN) {
    disconnectQMgr(&hConn);
  }

  printf("\nDone. Exit code:%d\n", rc);
  exit(rc);
}

/*
 * Subscribe to a topic
 *
 * Return 0 if OK; -1 otherwise
 */
static int subscribeTopic(MQHCONN hConn, PMQHOBJ pTopicHObj, PMQHOBJ pQueueHObj) {
  MQLONG compCode;
  MQLONG reason;
  MQCHARV objectString = {MQCHARV_DEFAULT};
  char topic[1024] = {0};

  int rc = 0;

  MQSD mqsd = {MQSD_DEFAULT};

  mqsd.Options = MQSO_CREATE | MQSO_MANAGED;
  mqsd.Options |= MQSO_NON_DURABLE;
  mqsd.Options |= MQSO_FAIL_IF_QUIESCING;

  // The objectString contains the full topic string that we
  // want to use. Alternatives allow a combination of administered object
  // names and the objectString value, but that's more advanced.
  if (!mqEndpoints[0].topicName) {
    printf("Error: No topic name supplied\n");
    return -1;
  }
  strncpy(topic, mqEndpoints[0].topicName, sizeof(topic) - 1);
  printf("Subscribing to %s\n", topic);

  objectString.VSPtr = topic;
  objectString.VSLength = (MQLONG)strlen(topic);
  mqsd.ObjectString = objectString;

  // Using the MANAGED option tells the queue manager to create a dynamic
  // queue from which we can read the messages. A handle to that queue
  // is returned from MQSUB, and we then use that for MQGET.
  MQSUB(hConn, &mqsd, pQueueHObj, pTopicHObj, &compCode, &reason);

  if (reason != MQRC_NONE) {
    printError("MQSUB", compCode, reason);
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
  MQLONG waitInterval = DEFAULT_WAIT_INTERVAL;

  int msgCount = 0;

  // Structure version must be high enough to recognise the MatchOptions field
  mqgmo.Version = MQGMO_VERSION_2;

  // Various options to control retrieval
  mqgmo.Options = MQGMO_NO_SYNCPOINT;
  mqgmo.Options |= MQGMO_FAIL_IF_QUIESCING;
  mqgmo.Options |= MQGMO_WAIT;
  mqgmo.Options |= MQGMO_CONVERT;

  mqgmo.Options |= MQGMO_ACCEPT_TRUNCATED_MSG; // Process the message even if it is too long for the buffer

  if (mqEndpoints[0].waitInterval) {
    waitInterval = atoi(mqEndpoints[0].waitInterval);
  }
  printf("waitInterval: %d\n", waitInterval);
  mqgmo.WaitInterval = waitInterval * 1000; // Convert seconds to milliseconds

  // Not going to try to match on MsgId or CorrelId
  mqgmo.MatchOptions = MQMO_NONE;

  // Loop until there are no more messages on the queue
  while (ok) {

    MQGET(hConn, hObj, &mqmd, &mqgmo, sizeof(buffer), buffer, &datalength, &compCode, &reason);

    if (reason == MQRC_NONE) {
      msgCount++;
      if (!strncmp(mqmd.Format, MQFMT_STRING, MQ_FORMAT_LENGTH)) {
        printf("Rcvd Message: %*.*s\n", datalength, datalength, buffer);
      } else {
        char title[32];
        sprintf(title, "Rcvd Message Type:%*.*s", MQ_FORMAT_LENGTH, MQ_FORMAT_LENGTH, mqmd.Format);
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
        msgCount++;
        // Carry on if there are more messages
        break;
      default:
        rc = -1;
        ok = 0;
        break;
      }
    }
  }

  printf("\nMessages read: %d\n", msgCount);
  return rc;
}
