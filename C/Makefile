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



ifndef CURL_INCLUDE
  CURL_INCLUDE := /opt/homebrew/opt/curl/include
endif

ifndef JSONC_INCLUDE
  JSONC_INCLUDE := /opt/homebrew/opt/json-c/include
endif

ifndef CURL_LIB
  CURL_LIB := /opt/homebrew/opt/curl/lib
endif

ifndef JSONC_LIB
  JSONC_LIB := /opt/homebrew/opt/json-c/lib
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
	$(CC) $(CDEBUG) -o $@ $@.c $(COMMONSRC) -I$(MQINC) -L$(MQLIB) -lmqm_r $(JWT_CFLAGS) $(JWT_LDFLAGS)
sampleget: sampleget.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) $(CDEBUG) -o $@ $@.c $(COMMONSRC) -I$(MQINC) -L$(MQLIB) -lmqm_r $(JWT_CFLAGS) $(JWT_LDFLAGS)

samplerequest: samplerequest.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) $(CDEBUG) -o $@ $@.c $(COMMONSRC) -I$(MQINC) -L$(MQLIB) -lmqm_r $(JWT_CFLAGS) $(JWT_LDFLAGS)

sampleresponse: sampleresponse.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) $(CDEBUG) -o $@ $@.c $(COMMONSRC) -I$(MQINC) -L$(MQLIB) -lmqm_r $(JWT_CFLAGS) $(JWT_LDFLAGS)

samplepublish: samplepublish.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) $(CDEBUG) -o $@ $@.c $(COMMONSRC) -I$(MQINC) -L$(MQLIB) -lmqm_r $(JWT_CFLAGS) $(JWT_LDFLAGS)

samplesubscribe: samplesubscribe.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) $(CDEBUG) -o $@ $@.c $(COMMONSRC) -I$(MQINC) -L$(MQLIB) -lmqm_r $(JWT_CFLAGS) $(JWT_LDFLAGS)
