COMMONSRC = common.c config.c
COMMONINC = common.h config.h 

MQINC=/opt/mqm/inc
MQLIB=/opt/mqm/lib64

APPS = sampleput \
       sampleget \
	   samplerequest \
	   sampleresponse \
	   samplepublish \
	   samplesubscribe

CDEBUG=-g

UNAME_S := $(shell uname -s)

ifndef CURL_INCLUDE

  ifeq ($(UNAME_S),Linux)
    CURL_INCLUDE := /usr/include/curl

  else ifeq ($(UNAME_S),AIX)
    CURL_INCLUDE := /opt/freeware/include/curl

  else
    CURL_INCLUDE := /opt/homebrew/opt/curl/include
  endif

endif

ifndef JSONC_INCLUDE

  ifeq ($(UNAME_S),Linux)
    JSONC_INCLUDE := /usr/include/json-c

  else ifeq ($(UNAME_S),AIX)
    JSONC_INCLUDE := /opt/freeware/include/json-c

  else
    JSONC_INCLUDE := /opt/homebrew/opt/json-c/include
  endif

endif

ifndef CURL_LIB

  ifeq ($(UNAME_S),Linux)
    CURL_LIB := /usr/lib64

  else ifeq ($(UNAME_S),AIX)
    CURL_LIB := /opt/freeware/lib

  else
    CURL_LIB := /opt/homebrew/opt/curl/lib
  endif

endif

ifndef JSONC_LIB

  ifeq ($(UNAME_S),Linux)
    JSONC_LIB := /usr/lib64

  else ifeq ($(UNAME_S),AIX)
    JSONC_LIB := /opt/freeware/lib

  else
    JSONC_LIB := /opt/homebrew/opt/json-c/lib
  endif
  
endif

ifeq ($(JWT),1)
  JWT_CFLAGS += -DJWT_ENABLED -I$(CURL_INCLUDE) -I$(JSONC_INCLUDE)
  JWT_LDFLAGS += -L$(CURL_LIB) -lcurl -L$(JSONC_LIB) -ljson-c
endif

all: $(APPS)
	@rm -rf *.dSYM

clean:
	rm -f $(APPS)
	@rm -rf *.dSYM
	@rm -f *.exe *.obj

sampleput: sampleput.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) $(CDEBUG) -o $@ $@.c $(COMMONSRC) $(JWT_CFLAGS) $(JWT_LDFLAGS) -I$(MQINC) -L$(MQLIB) -lmqm_r

sampleget: sampleget.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) $(CDEBUG) -o $@ $@.c $(COMMONSRC) $(JWT_CFLAGS) $(JWT_LDFLAGS) -I$(MQINC) -L$(MQLIB) -lmqm_r 

samplerequest: samplerequest.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) $(CDEBUG) -o $@ $@.c $(COMMONSRC) $(JWT_CFLAGS) $(JWT_LDFLAGS) -I$(MQINC) -L$(MQLIB) -lmqm_r 

sampleresponse: sampleresponse.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) $(CDEBUG) -o $@ $@.c $(COMMONSRC) $(JWT_CFLAGS) $(JWT_LDFLAGS) -I$(MQINC) -L$(MQLIB) -lmqm_r 

samplepublish: samplepublish.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) $(CDEBUG) -o $@ $@.c $(COMMONSRC) $(JWT_CFLAGS) $(JWT_LDFLAGS) -I$(MQINC) -L$(MQLIB) -lmqm_r 

samplesubscribe: samplesubscribe.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) $(CDEBUG) -o $@ $@.c $(COMMONSRC) $(JWT_CFLAGS) $(JWT_LDFLAGS) -I$(MQINC) -L$(MQLIB) -lmqm_r 
