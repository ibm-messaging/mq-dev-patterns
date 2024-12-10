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

/*
 * This is a demonstration showing the Publish operation to a MQ Topic
 * using the MQI C interface
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include <cmqc.h>

#include "common.h"
#include "config.h"

static int openTopic(MQHCONN hConn, PMQHOBJ pHObj);
static int publishMessage(MQHCONN hConn, MQHOBJ hObj, char *msg);

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
    rc = openTopic(hConn, &hObj);
  }

  if (rc == 0) {
    char msgData[DEFAULT_BUFFER_LENGTH];
    time(&now);
    // ctime always returns a 26-byte buffer. But we want to strip off the trailing "\n" and NUL.
    // So force the buffer to use 24 chars.
    sprintf(msgData, "Hello from C at %24.24s", ctime(&now));
    rc = publishMessage(hConn, hObj, msgData);
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
 * Open a topic for OUTPUT as we will be publishing a message
 *
 * Return 0 if OK; -1 otherwise
 */
static int openTopic(MQHCONN hConn, PMQHOBJ pHObj) {
  MQLONG compCode;
  MQLONG reason;
  MQCHARV objectString = {MQCHARV_DEFAULT};
  char *topic;
  int rc = 0;

  MQOD mqod = {MQOD_DEFAULT};
  MQLONG options = MQOO_OUTPUT;

  // The objectString contains the full topic string that we
  // want to use. Alternatives allow a combination of administered object
  // names and the objectString value, but that's more advanced.
   if (!mqEndpoints[0].topicName) {
    printf("Error: No topic name supplied\n");
    return -1;
  }
  topic = mqEndpoints[0].topicName;
  objectString.VSPtr = topic;
  objectString.VSLength = (MQLONG)strlen(topic);

  mqod.Version = MQOD_VERSION_4; // The ObjectString field requires this level of structure
  mqod.ObjectType = MQOT_TOPIC;
  mqod.ObjectString = objectString;

  MQOPEN(hConn, &mqod, options, pHObj, &compCode, &reason);

  if (reason != MQRC_NONE) {
    printError("MQOPEN", compCode, reason);
    rc = -1;
  }

  return rc;
}

/*
 * Publish the message on the topic
 *
 * Return 0 if OK; -1 otherwise
 */
static int publishMessage(MQHCONN hConn, MQHOBJ hObj, char *msg) {
  MQLONG compCode;
  MQLONG reason;
  int rc = 0;
  MQMD mqmd = {MQMD_DEFAULT};
  MQPMO mqpmo = {MQPMO_DEFAULT};

  // Options to control how the message is published. We might be interested
  // to know if there are no subscribers.
  mqpmo.Options = MQPMO_FAIL_IF_QUIESCING;
  mqpmo.Options |= MQPMO_NO_SYNCPOINT;
  mqpmo.Options |= MQPMO_NEW_MSG_ID;
  mqpmo.Options |= MQPMO_WARN_IF_NO_SUBS_MATCHED;

  // We are sending a character string. Set the format to indicate
  // that, so that the recipient can convert the codepage if necessary
  memcpy(mqmd.Format,MQFMT_STRING,MQ_FORMAT_LENGTH);

  // Now publish the message
  MQPUT(hConn, hObj, &mqmd, &mqpmo, strlen(msg), msg, &compCode, &reason);
  if (reason != MQRC_NONE) {
    printError("MQPUT", compCode, reason);
    rc = -1;
  } else {
    printf("Sent Message: %s\n",msg);
  }

  return rc;
}
