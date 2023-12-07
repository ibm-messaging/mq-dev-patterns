# IBM MQ Go AMQP 1.0 samples
The Go samples are based on go-amqp (a Go AMQP 1.0 client implementation) as provided here: [AMQP 1.0 client module for Go](https://github.com/Azure/go-amqp)
## Go Samples

1. amqpPut.go
2. amqpGet.go

### amqpPut.go
This Go application is used to put 10 messages from the client to the destination in the broker (IBM MQ). Messages can be put either onto a Queue or a Topic. 
Following are the parameters that can be passed to the application:
```
-t : Topic name
-q : Queue name
```
Any one parameter must be used. That is, either a Queue or a Topic.

### amqpGet.go
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
go run amqpPut.go -q DEMOQUEUE
```

In a separate terminal
```
go run amqpGet.go -q DEMOQUEUE
```


## Publish / Subscribe

In the first terminal;

You have to run the amqpGet.go sample first so it creates a subscription and waits for a publication.

Run
```
go run amqpGet.go -t abc/top
```

In the second terminal;

Run the amqpPut.go sample
```
go run amqpPut.go -t abc/top
```
