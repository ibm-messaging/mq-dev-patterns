/**
 * Copyright 2019, 2020 IBM Corp.
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
	"encoding/hex"
	"encoding/json"
	"log"
	"math/rand"
	"github.com/ibm-messaging/mq-golang/v5/ibmmq"
	"mqdevpatterns/src/mqsamputils"
	"os"
	"strings"
	"time"
)

var logger = log.New(os.Stdout, "MQ Put: ", log.LstdFlags)

type message struct {
	Greeting string `json:"greeting"`
	Value    int    `json:"value"`
}

// Main Entry to Put application
// Creates Connection to Queue
func main() {

	logger.Println("Application is Starting")

	logSettings()
	mqsamputils.EnvSettings.LogSettings()

	qMgr, err := mqsamputils.CreateConnection(mqsamputils.FULL_STRING)
	if err != nil {
		logger.Fatalln("Unable to Establish Connection to server")
		os.Exit(1)
	}
	defer qMgr.Disc()

	qObject, err := mqsamputils.OpenQueue(qMgr, mqsamputils.Put)
	if err != nil {
		logger.Fatalln("Unable to Open Queue")
		os.Exit(1)
	}
	defer qObject.Close(0)

	putMessage(qObject)

	logger.Println("Application is Ending")
}

// Output authentication values to verify that they have
// been read from the envrionment settings
func logSettings() {
	logger.Printf("Username is (%s)\n", mqsamputils.EnvSettings.User)
	//logger.Printf("Password is (%s)\n", mqsamputils.EnvSettings.Password)
}

func logError(err error) {
	logger.Println(err)
}

func putMessage(qObject ibmmq.MQObject) {
	logger.Println("Writing Message to Queue")

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
		logger.Println("Unexpected error marhalling data to send")
		logError(err)
		return
	}

	// The message is always sent as bytes, so has to be converted before the PUT.

	// Now put the message to the queue
	logger.Printf("Sending message %s", data)
	err = qObject.Put(putmqmd, pmo, data)

	if err != nil {
		logError(err)
	} else {
		logger.Println("Put message to", strings.TrimSpace(qObject.Name))
		// Print the MsgId so it can be used as a parameter to amqsget
		logger.Println("MsgId:" + hex.EncodeToString(putmqmd.MsgId))
	}
}
