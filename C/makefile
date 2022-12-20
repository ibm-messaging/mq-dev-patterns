CC=gcc
CFLAGS=-Wall -g -I/opt/mqm/inc

MQM_HOME = /opt/mqm
LDFLAGS=-L$(MQM_HOME)/lib64 -lmqm -lmqmcs -lmqmzse

PROGS=amqsbcg0 amqsecha amqsgbr0 amqsget0 amqspuba amqsput0 amqsreq0 amqssuba

all: $(PROGS)

get_pass.o: get_pass.h get_pass.c
	$(CC) $(CFLAGS) -c get_pass.c

conn.o: conn.h conn.c
	$(CC) $(CFLAGS) -c conn.c

# Programs
amqsbcg0: amqsbcg0.c get_pass.o conn.o
	$(CC) $(CFLAGS) -o amqsbcg0 amqsbcg0.c get_pass.o conn.o $(LDFLAGS)

amqsecha: amqsecha.c
	$(CC) $(CFLAGS) -o amqsecha amqsecha.c $(LDFLAGS)

amqsgbr0: amqsgbr0.c
	$(CC) $(CFLAGS) -o amqsgbr0 amqsgbr0.c $(LDFLAGS)

amqsget0: amqsget0.c get_pass.o conn.o
	$(CC) $(CFLAGS) -o amqsget0 amqsget0.c get_pass.o conn.o $(LDFLAGS)

amqspuba: amqspuba.c get_pass.o conn.o
	$(CC) $(CFLAGS) -o amqspuba amqspuba.c get_pass.o conn.o $(LDFLAGS)

amqsput0: amqsput0.c get_pass.o conn.o
	$(CC) $(CFLAGS) -o amqsput0 amqsput0.c get_pass.o conn.o $(LDFLAGS)

amqsreq0: amqsreq0.c
	$(CC) $(CFLAGS) -o amqsreq0 amqsreq0.c $(LDFLAGS)

amqssuba: amqssuba.c get_pass.o conn.o
	$(CC) $(CFLAGS) -o amqssuba amqssuba.c get_pass.o conn.o $(LDFLAGS)

clean:
	rm -rf get_pass.o conn.o $(PROGS)
