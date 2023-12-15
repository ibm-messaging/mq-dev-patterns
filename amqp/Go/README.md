# IBM MQ Go AMQP 1.0 samples
The Go samples are based on go-amqp (a Go AMQP 1.0 client implementation) as provided in [AMQP 1.0 client module for Go](https://github.com/Azure/go-amqp) and have been tested with Golang version 1.20.4.
## Go Samples

1. amqpProducer.go
2. amqpConsumer.go

### amqpProducer.go
This Go application is used to put 10 messages from the client to the destination in the broker (IBM MQ). Messages can be put either onto a Queue or a Topic. 
Following are the parameters that can be passed to the application:
```
-t : Topic name
-q : Queue name
```
Any one parameter must be used. That is, either a Queue or a Topic.

### amqpConsumer.go
This Go application is used to get messages from the destination in the broker (IBM MQ) back to the client. Messages can be received either from a Queue or a Topic. 
Following are the parameters that can be passed to the application:
```
-t : Topic name
-q : Queue name
```
Any one parameter must be used. That is, either a Queue or a Topic.

## How to run the samples
### Put / Get

Run
```
go run amqpProducer.go -q DEMOQUEUE
```

In a separate terminal
```
go run amqpConsumer.go -q DEMOQUEUE
```


## Publish / Subscribe

In the first terminal;

You have to run the amqpConsumer.go sample first so it creates a subscription and waits for a publication.

Run
```
go run amqpConsumer.go -t abc/top
```

In the second terminal;

Run the amqpProducer.go sample
```
go run amqpProducer.go -t abc/top
```
