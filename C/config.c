#include <ctype.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "config.h"

/*
 * There are a number of 3rd-party C libraries to implement structures like maps (which might be
 * preferred here instead of explicit structures) but we want to stick to standard
 * functions and not rely on external packages. Similarly, we are not going to use
 * a generic JSON-parsing library.
 *
 * Note that we are VERY dependent on the format of the JSON config file
 * staying in its current format. Each element must be on a separate line.
 */

typedef struct nameValue {
  char *name;
  char *value;
} nv_t;

// Declaration of functions only used in this file
static char *stripLine(char *line);
static void splitLine(char *line, nv_t *nv);
static int overrideEnv(char **p, char *field);

static char *cfStrdup(char *);
static void cfFree(void *);
static void dumpConfig(char *);

#define LINE_LENGTH 255 // Long enough for the input file

// Externalised config structures
jwtEndpoint_t jwt;
mqEndpoint_t mqEndpoints[MAX_MQ_ENDPOINTS];
int epIdx = 0;
int debug = 0;

// Internal to this file
static jwtEndpoint_t *pJwt = &jwt;
static int or ; // Was an environment variable used to override config of qmgr endpoint

// Simplify checks when dumping strings that might be NULL
// The printf function does this on some, but not necessarily all, platforms
#define N(p) (p ? p : "(null)")

// Return 0 on success, -1 on failure
// Parse the given filename and load values into configuration structures.
// Then look for any environment variables that could override. The filename
// can be NULL, in which case only the env vars are considered.
int parseConfig(char *filename) {
  int rc = 0;
  int len;
  nv_t nv;
  mqEndpoint_t *ep;
  char *v;

  char line[LINE_LENGTH + 1] = {0};
  enum { ENDPOINT_MQ, ENDPOINT_JWT } section;

  epIdx = 0;
  ep = &mqEndpoints[epIdx];
  memset(ep, 0, sizeof(*ep));
  memset(pJwt, 0, sizeof(*pJwt));

  if (filename && (strlen(filename) > 0)) {
    FILE *fp = fopen(filename, "r");
    if (!fp) {
      printf("ERROR: Open of %s failed. Errno: %d [%s]\n", filename, errno, strerror(errno));
      return -1;
    }

    while (rc == 0) {
      if (fgets(line, LINE_LENGTH, fp) == NULL) {
        break;
      }

      len = strlen(line);
      if (len >= LINE_LENGTH - 1 && line[len - 1] != '\n' && line[len - 1] != '\r') {
        printf("ERROR: Line \"%s\" is too long\n", line);
        fclose(fp);
        return -1;
      }

      // Convert the input line into a trimmed version with spaces and some special chars removed
      stripLine(line);

      if (strstr(line, "MQ_ENDPOINTS:") != NULL) {
        section = ENDPOINT_MQ;
      } else if (section == ENDPOINT_MQ && strstr(line, "},{")) {
        // Currently The only array is the MQ endpoints. This line indicates we've moved into the next entry in the list
        if (epIdx == (MAX_MQ_ENDPOINTS - 1)) {
          printf("ERROR: File has too many MQ endpoint elements in JSON Array\n");
          fclose(fp);
          return -1;
        } else {
          epIdx++;
          ep = &mqEndpoints[epIdx];
          memset(ep, 0, sizeof(*ep));
        }

      } else if (strstr(line, "JWT_ISSUER:")) {
        section = ENDPOINT_JWT;
      }

      // Now split the line into name/value pairs
      splitLine(line, &nv);

      switch (section) {
      case ENDPOINT_MQ:
        if (!strcmp(nv.name, CONFIG_HOST))
          ep->host = nv.value;
        else if (!strcmp(nv.name, CONFIG_PORT))
          ep->port = nv.value;
        else if (!strcmp(nv.name, CONFIG_CHANNEL))
          ep->channel = nv.value;
        else if (!strcmp(nv.name, CONFIG_CCDT_URL))
          ep->ccdtUrl = nv.value;
        else if (!strcmp(nv.name, CONFIG_QMGR))
          ep->qmgr = nv.value;
        else if (!strcmp(nv.name, CONFIG_APP_USER))
          ep->appUser = nv.value;
         else if (!strcmp(nv.name, CONFIG_APPL_NAME))
          ep->applName = nv.value;
        else if (!strcmp(nv.name, CONFIG_APP_PASSWORD))
          ep->appPassword = nv.value;
        else if (!strcmp(nv.name, CONFIG_QUEUE_NAME))
          ep->queueName = nv.value;
        else if (!strcmp(nv.name, CONFIG_BACKOUT_QUEUE))
          ep->backoutQueue = nv.value;
        else if (!strcmp(nv.name, CONFIG_MODEL_QUEUE_NAME))
          ep->modelQueueName = nv.value;
        else if (!strcmp(nv.name, CONFIG_DYNAMIC_QUEUE_PREFIX))
          ep->dynamicQueuePrefix = nv.value;
        else if (!strcmp(nv.name, CONFIG_TOPIC_NAME))
          ep->topicName = nv.value;
        else if (!strcmp(nv.name, CONFIG_CIPHER))
          ep->cipher = nv.value;
        else if (!strcmp(nv.name, CONFIG_CIPHER_SUITE))
          ep->cipherSuite = nv.value;
        else if (!strcmp(nv.name, CONFIG_KEY_REPOSITORY))
          ep->keyRepository = nv.value;
        break;

      case ENDPOINT_JWT:
        if (!strcmp(nv.name, CONFIG_JWT_TOKEN_ENDPOINT))
          pJwt->tokenEndpoint = nv.value;
        else if (!strcmp(nv.name, CONFIG_JWT_TOKEN_USERNAME))
          pJwt->tokenUserName = nv.value;
        else if (!strcmp(nv.name, CONFIG_JWT_TOKEN_PWD))
          pJwt->tokenPwd = nv.value;
        else if (!strcmp(nv.name, CONFIG_JWT_TOKEN_CLIENTID))
          pJwt->tokenClientId = nv.value;
        break;

      default: // Ignore the line
        break;
      }
    }
    fclose(fp);
  }

  // Now process any overriding environment variables. The MQ
  // endpoints all go into the first structure

  ep = &mqEndpoints[0];
  or = 0;
  or += overrideEnv(&ep->host, CONFIG_HOST);
  or += overrideEnv(&ep->port, CONFIG_PORT);
  or += overrideEnv(&ep->channel, CONFIG_CHANNEL);
    or += overrideEnv(&ep->ccdtUrl, CONFIG_CCDT_URL);

  or += overrideEnv(&ep->qmgr, CONFIG_QMGR);
  or += overrideEnv(&ep->applName, CONFIG_APPL_NAME);

  or += overrideEnv(&ep->appUser, CONFIG_APP_USER);
  or += overrideEnv(&ep->appPassword, CONFIG_APP_PASSWORD);
  or += overrideEnv(&ep->queueName, CONFIG_QUEUE_NAME);
  or += overrideEnv(&ep->backoutQueue, CONFIG_BACKOUT_QUEUE);
  or += overrideEnv(&ep->modelQueueName, CONFIG_MODEL_QUEUE_NAME);
  or += overrideEnv(&ep->dynamicQueuePrefix, CONFIG_DYNAMIC_QUEUE_PREFIX);
  or += overrideEnv(&ep->topicName, CONFIG_TOPIC_NAME);
  or += overrideEnv(&ep->cipher, CONFIG_CIPHER);
  or += overrideEnv(&ep->cipherSuite, CONFIG_CIPHER_SUITE);
  or += overrideEnv(&ep->keyRepository, CONFIG_KEY_REPOSITORY);

  // Has all the config for a qmgr come from environment variables?
  if (or > 0 && epIdx == 0) {
    epIdx = 1;
  }

  // Don't need to know about JWT overrides as there's only one structure
  (void)overrideEnv(&pJwt->tokenEndpoint, CONFIG_JWT_TOKEN_ENDPOINT);
  (void)overrideEnv(&pJwt->tokenUserName, CONFIG_JWT_TOKEN_USERNAME);
  (void)overrideEnv(&pJwt->tokenPwd, CONFIG_JWT_TOKEN_PWD);
  (void)overrideEnv(&pJwt->tokenClientId, CONFIG_JWT_TOKEN_CLIENTID);

  // Call this if we want to check the config has been correctly parsed
  if (debug) {
    dumpConfig(filename);
  }

  return rc;
}

// Given an input line like "XXXX:YYYY", split it into name/value strings
// We can assume the line does not include a colon before the value starts, but
// the value itself COULD contain a colon.
//
// We create a strdup'ed copy of the value from the line. This
// memory is only allocated once during the execution so it may appear like a leak.
// But it should not be large enough to really worry about. If you do care, the freeConfig()
// function can be used once the configuration is no longer needed
static void splitLine(char *line, nv_t *nv) {
  nv->value = NULL;
  if (line) {
    char *p = strtok(line, ":");

    if (p) {
      nv->name = p;         // First token - don't need this ptr when we've finished working on the line
      p = strtok(NULL, ""); // Don't want to split the rest of the line
      if (p && strlen(p) > 0)
        nv->value = cfStrdup(p); // Copy the value so it's not lost when we parse the next line
    }
  }
}

/*
 * Input line is guaranteed to be NULL-terminated. We overwrite its contents, shuffling
 * valid chars downwards.So we end up with a left-justified line with no spaces and no quote chars.
 * We assume that spaces (in particular) are never significant either in the structure or the specific values.
 */
static char *stripLine(char *line) {
  int idx = 0;
  int i;

  int len = strlen(line);
  for (i = 0; i < len; i++) {
    switch (line[i]) {
    case ' ':
      break;
    case '\t':
      break;
    case '\"':
      break;
    case '\n':
      break;
    case '\r': // Deal with DOS line-endings
      break;
    default:
      line[idx++] = line[i];
      break;
    }
  }
  if (idx > 0 && line[idx - 1] == ',') { // Strip trailing commas
    line[idx - 1] = 0;
  } else {
    line[idx] = 0;
  }

  return line;
}

// Get a value from an environment variable to override anything
// that's been set in the config file.
// Return 1 if we've read the value from the env; 0 otherwise
static int overrideEnv(char **p, char *field) {
  int rc = 0;
  char *e = getenv(field);

  if (e) {
    rc = 1;
    // The config structures are all strdup'd strings. So if we're going
    // to override a value that's already loaded, we need
    // to free it first to avoid leaks.
    if (*p) {
      cfFree(*p);
    }
    *p = cfStrdup(e);
  }
  return rc;
}

static void dumpConfig(char *filename) {
  int i;

  printf("Configuration read from %s\n",N(filename));
  for (i = 0; i <= epIdx; i++) {
    mqEndpoint_t *ep = &mqEndpoints[i];
    printf("MQ Endpoint: %d\n", i);
    printf("  Host: %s\n", N(ep->host));
    printf("  Port: %s\n", N(ep->port));
    printf("  Channel : %s\n", N(ep->channel));
    printf("  Qmgr : %s\n", N(ep->qmgr));
    printf("  AppUser : %s\n", N(ep->appUser));
    printf("  AppPassword : %s\n", N(ep->appPassword));
    printf("  QueueName : %s\n", N(ep->queueName));
    printf("  BackoutQueue : %s\n", N(ep->backoutQueue));
    printf("  ModelQueueName : %s\n", N(ep->modelQueueName));
    printf("  DynamicQueuePrefix : %s\n", N(ep->dynamicQueuePrefix));
    printf("  TopicName : %s\n", N(ep->topicName));
    printf("  Cipher : %s\n", N(ep->cipher));
    printf("  CipherSuite : %s\n", N(ep->cipherSuite));
    printf("  KeyRepository : %s\n", N(ep->keyRepository));
  }

  printf("JWT Endpoint:\n");
  printf("  TokenEndpoint :%s\n", N(pJwt->tokenEndpoint));
  printf("  TokenUserName :%s\n", N(pJwt->tokenUserName));
  printf("  TokenPwd      :%s\n", N(pJwt->tokenPwd));
  printf("  TokenClientId :%s\n", N(pJwt->tokenClientId));
}

// Do the cleanup of the strdup'ed elements from the config.
void freeConfig() {
  int i;
  for (i = 0; i <= epIdx; i++) {
    mqEndpoint_t *ep = &mqEndpoints[i];
    cfFree(ep->host);
    cfFree((ep->port));
    cfFree(ep->channel);
    cfFree(ep->qmgr);
    cfFree(ep->appUser);
    cfFree(ep->appPassword);
    cfFree(ep->queueName);
    cfFree(ep->backoutQueue);
    cfFree(ep->modelQueueName);
    cfFree(ep->dynamicQueuePrefix);
    cfFree(ep->topicName);
    cfFree(ep->cipher);
    cfFree(ep->cipherSuite);
    cfFree(ep->keyRepository);
  }

  cfFree(pJwt->tokenEndpoint);
  cfFree(pJwt->tokenUserName);
  cfFree(pJwt->tokenPwd);
  cfFree(pJwt->tokenClientId);
}

// Wrapper around free() to avoid trying to free NULL pointers
static void cfFree(void *p) {
  if (p) {
    free(p);
  }
  return;
}

// Wrapper around strdup() to check for NULL returns
static char *cfStrdup(char *s) {
  char *p = strdup(s);

  // A failure to allocate memory is fatal.
  if (!p) {
    printf("ERROR: Cannot allocate memory.\n");
    exit(1);
  }
  return p;
}
