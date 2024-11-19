#if !defined PATTERN_COMMON_H
#define PATTERN_COMMON_H

#include <cmqc.h>

int  connectQMgr(PMQHCONN);
void disconnectQMgr(PMQHCONN);

void closeQueue(MQHCONN hConn, PMQHOBJ pHObj);

void printError(MQLONG compCode, MQLONG reason);

#endif