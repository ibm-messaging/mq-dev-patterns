/****************************************************************************************/
/*                                                                                      */
/*                                                                                      */
/*  Copyright 2023, 2025 IBM Corp.                                                      */
/*                                                                                      */
/*  Licensed under the Apache License, Version 2.0 (the "License");                     */
/*  you may not use this file except in compliance with the License.                    */
/*  You may obtain a copy of the License at                                             */
/*                                                                                      */
/*  http://www.apache.org/licenses/LICENSE-2.0                                          */
/*                                                                                      */
/*  Unless required by applicable law or agreed to in writing, software                 */
/*  distributed under the License is distributed on an "AS IS" BASIS,                   */
/*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.            */
/*  See the License for the specific language governing permissions and                 */
/*  limitations under the License.                                                      */
/*                                                                                      */
/*                                                                                      */
/****************************************************************************************/
/*                                                                                      */
/*  FILE NAME:      amqpConsumer.go                                                     */
/*                                                                                      */
/*  DESCRIPTION:    A Go applicaton used to receive messages from broker-IBM MQ.        */
/*  AMQP 1.0 in use. An Azure go-amqp library is used.                                  */
/*  Refer : https://github.com/Azure/go-amqp                                            */
/*  Documentation: https://pkg.go.dev/github.com/Azure/go-amqp#section-documentation    */
/*                                                                                      */
/*  How to Run:                                                                         */
/*  Usage:  go run amqpConsumer.go [-t TopicName] [-q QueueName]                        */
/*                                                                                      */
/*  Ex:  go run amqpConsumer.go -q LOCAL.QUEUE.1                                        */
/*                                                                                      */
/*  Parameters:                                                                         */
/*  -t ==> TopicName                                                                    */
/*  -q ==> QueueName                                                                    */
/****************************************************************************************/

package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"time"

	"github.com/Azure/go-amqp"
)

type Env struct {
	Username string `json:"APP_USER"`
	Password string `json:"APP_PASSWORD"`
	Host     string `json:"HOST"`
	Port     string `json:"PORT"`
}

type MQEndpoints struct {
	Points []Env `json:"MQ_ENDPOINTS"`
}

var (
	queueName   string
	topicName   string
	destination string
	isQueue     bool
)
var EnvSettings Env
var MQ_ENDPOINTS MQEndpoints

// Parsing the command line arguments
func parseArgs() {
	flag.StringVar(&queueName, "q", "", "Queue")
	flag.StringVar(&topicName, "t", "", "Topic")
	flag.Parse()

	// One, and only one, of the parameters must be provided
	if (queueName == "" && topicName == "") ||
		(queueName != "" && topicName != "") {
		flag.Usage()
		os.Exit(1)
	}

	if queueName != "" {
		isQueue = true
		destination = queueName
	} else {
		destination = topicName
	}
}

func main() {

	parseArgs()
	parseEnv()

	fmt.Println("Application is Starting...")

	//Defining the AMQP URI
	uri := "amqp://" + EnvSettings.Username + ":" + EnvSettings.Password + "@" + EnvSettings.Host + ":" + EnvSettings.Port

	// Set up a new connection
	conn, err := connect(uri)
	if err != nil {
		log.Fatal("Error in creating connection: ", err)
	}

	// Create a session
	session, err := createSession(conn)
	if err != nil {
		log.Fatal("Error in creating a session: ", err)
	}

	//When the destination is a queue, capability must be set to "queue". If not, topic is selected by default.
	ReceiverOptions := &amqp.ReceiverOptions{
		SourceCapabilities: []string{"topic"},
	}
	if isQueue {
		ReceiverOptions = &amqp.ReceiverOptions{
			SourceCapabilities: []string{"queue"},
		}
	}

	// Create a Receiver
	Receiver, err := createReceiver(session, ReceiverOptions)
	if err != nil {
		log.Fatal("Error in creating a Receiver: ", err)
	}

	//Recieve the messages
	err = receiveMessages(Receiver)
	if err != nil {
		fmt.Println("Error while receiving messages: ", err)
	}
	fmt.Println("End of Sample amqpConsumer.go")
}

func connect(uri string) (*amqp.Conn, error) {

	conn, err := amqp.Dial(context.TODO(), uri, nil)
	if err != nil {
		return nil, err
	}
	fmt.Println("Connected to host.")
	return conn, nil
}

func createSession(conn *amqp.Conn) (*amqp.Session, error) {

	session, err := conn.NewSession(context.TODO(), nil)
	if err != nil {
		return nil, err
	}
	fmt.Println("Session created.")
	return session, nil
}

func createReceiver(session *amqp.Session, receiverOptions *amqp.ReceiverOptions) (*amqp.Receiver, error) {
	receiver, err := session.NewReceiver(context.TODO(), destination, receiverOptions)
	if err != nil {
		return nil, err
	}
	fmt.Println("Receiver mapped to destination: ", destination)
	fmt.Println("Destination :", receiverOptions.SourceCapabilities)
	return receiver, nil
}

func receiveMessages(receiver *amqp.Receiver) error {

	// The receiver is given a 5s timeout. If no messages are
	// available in that time, the function ends
	timeout, _ := time.ParseDuration("5s")

	for {
		// Create a new Context from a parent
		c, _ := context.WithTimeout(context.TODO(), timeout)

		// And use it in the Receive call
		msg, err := receiver.Receive(c, nil)
		if err != nil {
			return err
		} else {
			if msg != nil {
				fmt.Println("Received message: ", string(msg.GetData()))
				receiver.AcceptMessage(c, msg)
			} else {
				fmt.Println("No More Messages")
				return nil
			}
		}

	}
}

// ***********Configuring MQ Credentials***********
// Read MQ configuration from env.json
// Check for file path in env variable ENV_FILE else default to ./env.json
func parseEnv() {
	DEFAULT_ENV_FILE := "./env.json"
	filePath := os.Getenv("ENV_FILE")
	if filePath != "" {
		fmt.Println("ENV file is set to " + filePath)
	} else {
		fmt.Println("Using default ENV file: " + DEFAULT_ENV_FILE)
		filePath = DEFAULT_ENV_FILE
	}
	content, err := ioutil.ReadFile(filePath)
	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}
	// Unmarshall the data
	err = json.Unmarshal(content, &MQ_ENDPOINTS)
	if err != nil {
		log.Fatal("Error during Unmarshal(): ", err)
	}
	if len(MQ_ENDPOINTS.Points) > 0 {
		EnvSettings = MQ_ENDPOINTS.Points[0]
	}
}
