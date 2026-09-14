# Spring Boot MVC Demo

This application presents a basic web application that interacts with MQ to send and receive messages. It uses Spring
Boot components, including the MQ and Tomcat Boot Starters.

The configuration is in _src/main/resources/application.properties_. There are options for connecting as a client to a
queue manager, and to set which port the Tomcat server listens on. The port can also be overridden by setting the
`SERVER_PORT` environment variable.

You may need to adjust values in that file for your environment.

## Running the program
To compile and run the program, use `mvn clean package spring-boot:run`. That will start the webserver on the
configured port.

Then point your browser at `http://localhost:8088` (or your chosen port) to see a simple page.From there, you can send
and receive messages.
