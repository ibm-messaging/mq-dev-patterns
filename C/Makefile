SRC = common.c config.c
INC = common.h config.h

MQINC=/opt/mqm/inc
MQLIB=/opt/mqm/lib64

all: parse \
     sampleput

parse: main.c config.c $(INC) Makefile
	cc -g -o $@ main.c config.c
	# parse

sampleput: sampleput.c $(SRC) $(INC) Makefile
	cc -g -o $@ $@.c $(SRC) -I$(MQINC) -L$(MQLIB) -lmqm_r

