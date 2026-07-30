/**
 * Copyright 2019, 2026 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"mqdevpatterns/src/mqsamputils"
	"os"
	"strings"
	"time"

	"github.com/ibm-messaging/mq-golang/v5/ibmmq"
)

var logger = log.New(os.Stdout, "MQ Pub: ", log.LstdFlags)

type message struct {
	Greeting string `json:"greeting"`
	Value    int    `json:"value"`
}

// Main entry to Publish application
// Creates connection to Queue Manager
func main() {

	logger.Println("Application is starting")

	mqsamputils.EnvSettings.LogSettings()

	qMgr, err := mqsamputils.CreateConnection(mqsamputils.FULL_STRING)
	if err != nil {
		logger.Fatalln("Unable to establish connection to server")
		os.Exit(1)
	}
	defer qMgr.Disc()

	topicObject, err := mqsamputils.OpenObject(qMgr, mqsamputils.Pub)
	if err != nil {
		logger.Fatalln("Unable to publish to topic")
		os.Exit(1)
	}
	defer topicObject.Close(0)

	putMessage(topicObject)

	logger.Println("Application is ending")
}

func logError(err error) {
	logger.Println(err)
	os.Exit(1)
}

func putMessage(topicObject ibmmq.MQObject) {
	logger.Println("Publishing to topic")

	// The PUT requires control structures, the Message Descriptor (MQMD)
	// and Put Options (MQPMO). Create those with default values.
	putmqmd := ibmmq.NewMQMD()
	pmo := ibmmq.NewMQPMO()

	// The default options are OK, but it's always
	// a good idea to be explicit about transactional boundaries as
	// not all platforms behave the same way.
	pmo.Options = ibmmq.MQPMO_NO_SYNCPOINT

	// Tell MQ what the message body format is. In this case, a text string
	putmqmd.Format = ibmmq.MQFMT_STRING

	// And create the contents to include a timestamp just to prove when it was created
	msgData := &message{
		Greeting: "Hello from Go at " + time.Now().Format(time.RFC3339),
		Value:    rand.Intn(100)}

	data, err := json.Marshal(msgData)
	if err != nil {
		logger.Println("Unexpected error marshalling data to send")
		logError(err)
		return
	}

	// Now put the message to the queue. The "data" needs to be byte[], which
	// is already the return type from json.Marshal
	logger.Printf("Sending message %s", data)
	err = topicObject.Put(putmqmd, pmo, data)

	if err != nil {
		logError(err)
	} else {
		logger.Println("Published to topic:", strings.TrimSpace(topicObject.Name))
	}
}
