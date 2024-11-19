#include <stdio.h>
#include <string.h>

#include <cmqc.h>
#include <cmqstrc.h>
#include <cmqxc.h>

#include "common.h"
#include "config.h"


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
  // Otherwise attempt a local bindings connection
  if (ep.ccdtUrl) {
    mqcno.Options |= MQCNO_CLIENT_BINDING;
    mqcno.CCDTUrlPtr = ep.ccdtUrl;
    mqcno.CCDTUrlLength = strlen(ep.ccdtUrl);
  } else {
    if (ep.channel && ep.host) {
      mqcno.Options |= MQCNO_CLIENT_BINDING;
      strncpy(mqcd.ChannelName,ep.channel,MQ_CHANNEL_NAME_LENGTH);

      // Build the connname. If there are multiple endpoints defined,
      // then we use the host/port info from all of them to build the conname.
      // Should end up with a string like "host1(port),host2,host3(port3)"
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
      mqcno.Options |= MQCNO_LOCAL_BINDING;
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

  // Finally we can try to connect to the queue manager
  MQCONNX(ep.qmgr, &mqcno, pHConn, &compCode, &reason);
  if (reason != MQRC_NONE) {
    printError(compCode, reason);
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
    printError(compCode, reason);
  }
}

// Close the queue. No need for
// any error return code as there's no sensible recovery possible
// if it went wrong.
void closeQueue(MQHCONN hConn, PMQHOBJ pHObj) {
  MQLONG compCode;
  MQLONG reason;
  MQLONG options = 0;

  MQCLOSE(hConn, pHObj, options, &compCode, &reason);

  if (reason != MQRC_NONE) {
    printError(compCode, reason);
  }

  return;
}

void printError(MQLONG compCode, MQLONG reason) {
  printf("CompCode: %d [%s] Reason: %d [%s]\n", compCode, MQCC_STR(compCode), reason, MQRC_STR(reason));
  return;
}