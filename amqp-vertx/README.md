# Vert.x AMQP to IBM MQ Sample

The main class for this sample is `Runner` where we create the objects we will need to run our receiver application. 

To get started, you will need to clone this repository and cd into it:

```
cd mq-dev-patterns/amqp-vertx/vertx-tutorial
```

## MQ Connection properties

The properties we will need to connect to MQ queue manager in our application:

- `HOST_NAME`
  - `localhost`
- `PORT`
  - designated AMQP port which is `5672`
- `MQ_USER`
  - MQ app username
- `PASSWORD`
  - MQ app password

## Native executable

### Running the application

To build the native executable:

```
mvn clean package dependency:copy-dependencies 
```

To run the native executable:

```
java -cp "target/receiver-example-1.jar:target/dependency/*" vertxtutorial.Runner  
```