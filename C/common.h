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

#if !defined PATTERN_COMMON_H
#define PATTERN_COMMON_H

#include <cmqc.h>

int  connectQMgr(PMQHCONN);
void disconnectQMgr(PMQHCONN);

void closeQueue(MQHCONN hConn, PMQHOBJ pHObj);
void closeObject(MQHCONN hConn, PMQHOBJ pHObj);

void printError(char *verb, MQLONG compCode, MQLONG reason);
void dumpHex(const char *title, void *buf, int length);

#define DEFAULT_BUFFER_LENGTH 256

#endif