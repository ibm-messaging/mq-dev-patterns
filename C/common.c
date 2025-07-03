/**
 * Copyright 2024,2025 IBM Corp.
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

#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include <stdlib.h>

#ifdef JWT_ENABLED
#include <curl/curl.h>
#include <json-c/json.h>
#endif

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
  jwtEndpoint_t jwtEp = jwt;

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

    // Point at a certificate repository. This needs to contain. at minimum,
    // the signing information for the queue manager's certificate.
    // This may be needed even when using the CCDT as that file does not include
    // information about the keystores, even though the CCDT could have all the
    // other TLS information such as the Ciphers to be used.
    if (ep.keyRepository) {
      strncpy(mqsco.KeyRepository,ep.keyRepository,MQ_SSL_KEY_REPOSITORY_LENGTH);
      mqcno.SSLConfigPtr = &mqsco;
    }
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
      // For example, we could specify a user-provided password to the repository
      // instead of relying on a stashed (.sth) file.
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

  #ifdef JWT_ENABLED

  if (jwtCheck(jwtEp)) {

    char *token = obtainToken(jwtEp);

    if (!token) {
      fprintf(stderr, "Failed to obtain token — exiting.\n");
      return rc;  
    }
    
    printf("Using token:\n%s\n", token);

    mqcsp.Version = MQCSP_VERSION_3;
    mqcsp.TokenPtr = token;
    mqcsp.AuthenticationType = MQCSP_AUTH_ID_TOKEN;
    mqcsp.TokenLength = (MQLONG) strlen(token);
    mqcno.SecurityParmsPtr = &mqcsp;

  } else
  #endif

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

#ifdef JWT_ENABLED
// check for any missing JWT credentials
int jwtCheck(jwtEndpoint_t jwtEp) {

  if (!jwtEp.tokenEndpoint || !jwtEp.tokenUserName || !jwtEp.tokenPwd || !jwtEp.tokenClientId) {
    printf("One or more JWT credentials missing, will not be using JWT to authenticate\n");
    return 0;

  } else {
    printf("JWT credentials found, will be using JWT to authenticate\n");
  }
  return 1;
}

// callback function to write response from curl request into memory
size_t write_chunk(void *data, size_t size, size_t nmemb, void *userdata){

  size_t totalSize = size * nmemb;

  jwtResponse *response = (jwtResponse *) userdata;

  char *ptr = realloc(response->string, response->size + totalSize + 1);

  if (ptr == NULL) {
    return CURL_WRITEFUNC_ERROR;
  }

  response->string = ptr;
  memcpy(&(response->string[response->size]), data, totalSize);
  response->size += totalSize;
  response->string[response->size] = 0;

  return totalSize;
}

// use the libCurl library to obtain token
// use the json-c library to parse the response and extract access token
char* obtainToken(jwtEndpoint_t jwtEp) {

  CURL *curl;
  CURLcode result;
  char post_data[512];
  struct json_object *parsed_json = NULL;
  struct json_object *accessToken = NULL;
  char *token = NULL;

  snprintf(post_data, sizeof(post_data),
    "username=%s&password=%s&client_id=%s&grant_type=password",
    jwtEp.tokenUserName, jwtEp.tokenPwd, jwtEp.tokenClientId);

  curl = curl_easy_init();
  if (curl == NULL) {
    fprintf(stderr, "request failed\n");
    return NULL;
  }

  jwtResponse response;
  response.string = malloc(1);
  response.size = 0;

  curl_easy_setopt(curl, CURLOPT_URL, jwtEp.tokenEndpoint);
  curl_easy_setopt(curl, CURLOPT_POSTFIELDS, post_data);
  curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_chunk);
  curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *) &response);

  // if the token issuer is a https server, access the server's public certificate
  // JWT_KEY_REPOSITORY must point to the server's public certificate
  if (jwtEp.tokenKeyRepository) {
    curl_easy_setopt(curl, CURLOPT_CAINFO, jwtEp.tokenKeyRepository);
    curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 2L);

    // uncomment the following command to debug https request
    //curl_easy_setopt(curl, CURLOPT_VERBOSE, 1L);
  }

  result = curl_easy_perform(curl);

  if (result != CURLE_OK) {
    fprintf(stderr, "Error: %s\n", curl_easy_strerror(result));
    curl_easy_cleanup(curl);
    free(response.string);
    return NULL;
  }

  curl_easy_cleanup(curl);


  parsed_json = json_tokener_parse(response.string);
  if (!parsed_json) {
    fprintf(stderr, "Failed to parse JSON response\n");
    free(response.string);
    return NULL;
  }

  if (!json_object_object_get_ex(parsed_json, "access_token", &accessToken)) {
    fprintf(stderr, "JSON does not contain 'access_token'\n");
    json_object_put(parsed_json);
    free(response.string);
    return NULL;
  }

  const char *temp = json_object_get_string(accessToken);
  token = strdup((char *)temp);

  json_object_put(parsed_json);

  free(response.string);

  return token;
}
#endif