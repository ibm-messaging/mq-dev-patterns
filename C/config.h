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

#if !defined PATTERN_CONFIG_H
#define PATTERN_CONFIG_H

// Where to read the configuration from unless overridden
#define DEFAULT_CONFIG_FILE "../env.json"
#define CONFIG_JSON_FILE "JSON_CONFIG"

// Structures to hold configuration values
typedef struct mqEndpoint {
  char *host;
  char *port;
  char *channel;
  char *qmgr;
  char *ccdtUrl;
  char *appUser;
  char *appPassword;
  char *applName;
  char *queueName;
  char *backoutQueue;
  char *modelQueueName;
  char *dynamicQueuePrefix;
  char *topicName;
  char *cipher;
  char *cipherSuite;
  char *keyRepository;
  char *waitInterval;
} mqEndpoint_t;

typedef struct jwtEndpoint {
  char *tokenEndpoint;
  char *tokenUserName;
  char *tokenPwd;
  char *tokenClientId;
} jwtEndpoint_t;

#define MAX_MQ_ENDPOINTS 10 // Put a limit on the number of entries in the config file for simplicity
extern mqEndpoint_t mqEndpoints[];
extern int epIdx;
extern jwtEndpoint_t jwt;

extern int debug;

// External function declarations
int parseConfig(char *filename);
void freeConfig();

#define CONFIG_HOST      "HOST"
#define CONFIG_PORT      "PORT"
#define CONFIG_CHANNEL   "CHANNEL"
#define CONFIG_CCDT_URL  "CCDT_URL"
#define CONFIG_QMGR      "QMGR"

#define CONFIG_APPL_NAME            "APPL_NAME"
#define CONFIG_APP_USER             "APP_USER"
#define CONFIG_APP_PASSWORD         "APP_PASSWORD"

#define CONFIG_QUEUE_NAME           "QUEUE_NAME"
#define CONFIG_BACKOUT_QUEUE        "BACKOUT_QUEUE"
#define CONFIG_MODEL_QUEUE_NAME     "MODEL_QUEUE_NAME"
#define CONFIG_DYNAMIC_QUEUE_PREFIX "DYNAMIC_QUEUE_PREFIX"
#define CONFIG_TOPIC_NAME           "TOPIC_NAME"

#define CONFIG_CIPHER               "CIPHER"
#define CONFIG_CIPHER_SUITE         "CIPHER_SUITE"
#define CONFIG_KEY_REPOSITORY       "KEY_REPOSITORY"

#define CONFIG_WAIT_INTERVAL        "WAIT_INTERVAL"

#define CONFIG_JWT_TOKEN_ENDPOINT   "JWT_TOKEN_ENDPOINT"
#define CONFIG_JWT_TOKEN_USERNAME   "JWT_TOKEN_USERNAME"
#define CONFIG_JWT_TOKEN_PWD        "JWT_TOKEN_PWD"
#define CONFIG_JWT_TOKEN_CLIENTID   "JWT_TOKEN_CLIENTID"

// Environment variable only
#define CONFIG_DEBUG "DEBUG"

#endif