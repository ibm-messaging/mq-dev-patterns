#include <stdio.h>
#include <string.h>
#include <ctype.h>

#include <cmqc.h>
#include <cmqstrc.h>
#include <cmqxc.h>

#include "common.h"
#include "config.h"

static const char *hexChars = "0123456789ABCDEF";

/*
 * Connect to a queue manager
 * Use the loaded configuration information to build the various structures
 * Both client and local connections can be made
 */
int connectQMgr(PMQHCONN pHConn) {
  MQLONG compCode;
  MQLONG reason;
  int rc = 0;
  int i;

  MQCNO mqcno = {MQCNO_DEFAULT};
  MQSCO mqsco = {MQSCO_DEFAULT};
  MQCSP mqcsp = {MQCSP_DEFAULT};
  MQCD mqcd = {MQCD_CLIENT_CONN_DEFAULT};
  MQCHAR ConnectionName[MQ_CONN_NAME_LENGTH + 1] = {0};
  int s = sizeof(ConnectionName);

  mqEndpoint_t ep = mqEndpoints[0];

  // Set structure version high enough to include all the fields we might want to use
  mqcno.Version = MQCNO_VERSION_8;

  // Build the connection information. If there is a CCDT, then point at that.
  // Otherwise build the MQCD client channel structure if we have configuration for that
  // Otherwise attempt the default type of connection which might be local bindings or client
  // - MQSERVER and MQ_CONNECT_TYPE environment variables can control that process
  if (ep.ccdtUrl) {
    mqcno.Options |= MQCNO_CLIENT_BINDING;
    mqcno.CCDTUrlPtr = ep.ccdtUrl;
    mqcno.CCDTUrlLength = strlen(ep.ccdtUrl);
  } else {
    if (ep.channel && ep.host) {
      mqcno.Options |= MQCNO_CLIENT_BINDING;

      // Use strncpy with the maximum length of the field in the structure
      // The MQI does not use NULL-terminated strings in its char fields.
      strncpy(mqcd.ChannelName,ep.channel,MQ_CHANNEL_NAME_LENGTH);

      // Build the connname. If there are multiple endpoints defined,
      // then we use the host/port info from all of them to build the conname.
      // Should end up with a string like "host1(port1),host2,host3(port3)"
      for (i=0;i<=epIdx;i++) {
        if (i > 0) {
            strncat(ConnectionName,",", s);
        }
        strncat(ConnectionName,mqEndpoints[i].host,s);
        if (mqEndpoints[i].port) {
            strncat(ConnectionName,"(",s);
            strncat(ConnectionName,mqEndpoints[i].port,s);
            strncat(ConnectionName,")",s);
        }
      }
      strncpy(mqcd.ConnectionName,ConnectionName,MQ_CONN_NAME_LENGTH);

      // Set the TLS Cipher to be used
      if (ep.cipher) {
        strncpy(mqcd.SSLCipherSpec,ep.cipher,MQ_SSL_CIPHER_SPEC_LENGTH);
      } else if (ep.cipherSuite) {
        strncpy(mqcd.SSLCipherSpec,ep.cipherSuite,MQ_SSL_CIPHER_SPEC_LENGTH);
      }

      // Point at a certificate repository. This needs to contain. at minimum,
      // the signing information for the queue manager's certificate.
      // There are more options that COULD be used here, but this is the simplest.
      if (ep.keyRepository) {
        strncpy(mqsco.KeyRepository,ep.keyRepository,MQ_SSL_KEY_REPOSITORY_LENGTH);
        mqcno.SSLConfigPtr = &mqsco;
      }

      // The client configuration is now referenced from the connect options structure
      mqcno.ClientConnPtr = &mqcd;

    } else {
      // Just take the default connection type. Don't try to explicitly set
      // client or local bindings.
    }

  }

  // Authentication can apply for both local and client connections
  // Using JWT tokens would require code to actually get the token from
  // a server first, so that's not going in here for now.
  if (ep.appUser) {
    mqcsp.CSPUserIdPtr = ep.appUser;
    mqcsp.CSPUserIdLength = strlen(ep.appUser);
    mqcsp.CSPPasswordPtr = ep.appPassword;
    mqcsp.CSPPasswordLength = strlen(ep.appPassword);
    mqcsp.AuthenticationType = MQCSP_AUTH_USER_ID_AND_PWD;
    mqcno.SecurityParmsPtr = &mqcsp;
  }

  if (ep.applName) {
    strncpy(mqcno.ApplName,ep.applName,MQ_APPL_NAME_LENGTH);
  }

  // Finally we can try to connect to the queue manager
  MQCONNX(ep.qmgr, &mqcno, pHConn, &compCode, &reason);
  if (reason != MQRC_NONE) {
    printError("MQCONNX", compCode, reason);
    rc = -1;
  }

  return rc;
}

// Disconnect from the queue manager. No need for
// any error return code as there's no sensible recovery possible
// if it went wrong.
void disconnectQMgr(PMQHCONN pHConn) {
  MQLONG compCode;
  MQLONG reason;

  MQDISC(pHConn, &compCode, &reason);
  if (reason != MQRC_NONE) {
    printError("MQDISC", compCode, reason);
  }
}

// Close the object. No need for
// any error return code as there's no sensible recovery possible
// if it went wrong. Closing a queue is more common than closing other
// object types so we've got an explicitly-named function that does no more
// than calling the generic one.
void closeQueue(MQHCONN hConn, PMQHOBJ pHObj) {
   closeObject(hConn,pHObj);
}

void closeObject(MQHCONN hConn, PMQHOBJ pHObj) {
  MQLONG compCode;
  MQLONG reason;
  MQLONG options = 0;

  MQCLOSE(hConn, pHObj, options, &compCode, &reason);

  if (reason != MQRC_NONE) {
    printError("MQCLOSE", compCode, reason);
  }

  return;
}

// Print the CC/RC values in a formatted string. Show both the numeric and string values
void printError(char *verb, MQLONG compCode, MQLONG reason) {
  printf("Call: %s CompCode: %d [%s] Reason: %d [%s]\n", verb, compCode, MQCC_STR(compCode), reason, MQRC_STR(reason));
  return;
}


/* A simple formatter for hex data showing chars and bytes */
void dumpHex(const char *title, void *buf, int length) {
  int i, j;
  unsigned char *p = (unsigned char *)buf;
  int rows;
  int o;
  char line[80];
  FILE *fp = stdout;

  fprintf(fp, "-- %s -- (%d bytes) --------------------\n", title, length);

  rows = (length + 15) / 16;
  for (i = 0; i < rows; i++) {

    memset(line, ' ', sizeof(line));
    o = snprintf(line, sizeof(line)-1, "%8.8X : ", i * 16);

    for (j = 0; j < 16 && (j + (i * 16) < length); j++) {
      line[o++] = hexChars[p[j] >> 4];
      line[o++] = hexChars[p[j] & 0x0F];
      if (j % 4 == 3)
        line[o++] = ' ';
    }

    o = 48;
    line[o++] = '|';
    for (j = 0; j < 16 && (j + (i * 16) < length); j++) {
      char c = p[j];
      if (!isalnum((int)c) && !ispunct((int)c) && (c != ' '))
        c = '.';
      line[o++] = c;
    }

    o = 65;
    line[o++] = '|';
    line[o++] = 0;

    fprintf(fp, "%s\n", line);
    p += 16;
  }

  return;
}