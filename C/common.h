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