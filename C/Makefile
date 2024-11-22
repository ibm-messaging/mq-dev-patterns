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

all: $(APPS)
	@rm -rf *.dSYM

clean:
	rm -f $(APPS)
	@rm -rf *.dSYM
	@rm -f *.exe *.obj

sampleput: sampleput.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) -g -o $@ $@.c $(COMMONSRC) -I$(MQINC) -L$(MQLIB) -lmqm_r

sampleget: sampleget.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) -g -o $@ $@.c $(COMMONSRC) -I$(MQINC) -L$(MQLIB) -lmqm_r

samplerequest: samplerequest.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) -g -o $@ $@.c $(COMMONSRC) -I$(MQINC) -L$(MQLIB) -lmqm_r

sampleresponse: sampleresponse.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) -g -o $@ $@.c $(COMMONSRC) -I$(MQINC) -L$(MQLIB) -lmqm_r

samplepublish: samplepublish.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) -g -o $@ $@.c $(COMMONSRC) -I$(MQINC) -L$(MQLIB) -lmqm_r

samplesubscribe: samplesubscribe.c $(COMMONSRC) $(COMMONINC) Makefile
	$(CC) -g -o $@ $@.c $(COMMONSRC) -I$(MQINC) -L$(MQLIB) -lmqm_r
