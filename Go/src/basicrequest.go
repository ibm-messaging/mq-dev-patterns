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
	"encoding/hex"
	"encoding/json"
	"log"
	"math/rand"
	"mqdevpatterns/src/mqsamputils"
	"os"
	"strings"
	"time"

	"github.com/ibm-messaging/mq-golang/v5/ibmmq"
)

var logger = log.New(os.Stdout, "MQ Req: ", log.LstdFlags)

type message struct {
	Greeting string `json:"greeting"`
	Value    int    `json:"value"`
}

// Main entry to the request application
// Creates connection to Queue Manager
func main() {
	logger.Println("Application is starting")

	mqsamputils.EnvSettings.LogSettings()

	qMgr, err := mqsamputils.CreateConnection(mqsamputils.FULL_STRING)
	if err != nil {
		logger.Fatalln("Unable to establish connection to server")
	}
	defer qMgr.Disc()

	// Open the output queue
	mqod := ibmmq.NewMQOD()
	mqod.ObjectType = ibmmq.MQOT_Q
	mqod.ObjectName = mqsamputils.EnvSettings.QueueName

	qObject, err := qMgr.Open(mqod, ibmmq.MQOO_OUTPUT)
	if err != nil {
		logger.Fatalln("Unable to open output queue")
	}
	defer qObject.Close(0)

	// Open the model reply queue, getting a dynamic queue reference
	mqod = ibmmq.NewMQOD()
	mqod.ObjectType = ibmmq.MQOT_Q
	mqod.ObjectName = mqsamputils.EnvSettings.ModelQueueName
	mqod.DynamicQName = mqsamputils.EnvSettings.DynamicQueueName
	logger.Printf("Attempting to open reply queue %s", mqsamputils.EnvSettings.ModelQueueName)

	qObjDynamic, err := qMgr.Open(mqod, ibmmq.MQOO_INPUT_EXCLUSIVE)
	if err != nil {
		logger.Fatalln("Unable to create dynamic reply queue")
	}
	defer qObjDynamic.Close(0)

	msgId, err := putMessage(qObject, qObjDynamic)
	if err != nil {
		logger.Fatalln("Unable to send request")
	}

	// Wait for a message that matches the original request. Default behaviour for a responder is to copy
	// the original MsgId into the CorrelId, so we put that into the MQGET options
	awaitResponse(qObjDynamic, msgId)

	logger.Println("Application is ending")
}

func logError(err error) {
	logger.Println(err)
	os.Exit(1)
}

// Return the MsgId from the request message so it can be used as the correlator for the reply
func putMessage(qObject ibmmq.MQObject, qDynamicObject ibmmq.MQObject) ([]byte, error) {
	logger.Println("Writing message to queue")
	var msgId []byte

	// The PUT requires control structures, the Message Descriptor (MQMD)
	// and Put Options (MQPMO). Create those with default values.
	putmqmd := ibmmq.NewMQMD()
	putmqmd.ReplyToQ = qDynamicObject.Name
	putmqmd.MsgType = ibmmq.MQMT_REQUEST
	pmo := ibmmq.NewMQPMO()

	// The default options are OK, but it's always
	// a good idea to be explicit about transactional boundaries as
	// not all platforms behave the same way.
	pmo.Options = ibmmq.MQPMO_NO_SYNCPOINT | ibmmq.MQPMO_NEW_MSG_ID | ibmmq.MQPMO_NEW_CORREL_ID

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
	}

	// The message is always sent as bytes, which is already returned by the Marshal function
	// Now put the message to the queue
	logger.Printf("Sending message %s", data)
	err = qObject.Put(putmqmd, pmo, data)

	if err != nil {
		logError(err)
	} else {
		logger.Printf("Put message to %s", strings.TrimSpace(qObject.Name))
		logger.Printf("  MsgId: %s", hex.EncodeToString(putmqmd.MsgId))
		msgId = putmqmd.MsgId
	}
	return msgId, err
}

func awaitResponse(qDynamicObject ibmmq.MQObject, correlId []byte) {
	logger.Println("Waiting for a response")
	var err error

	var datalen int

	// The PUT requires control structures, the Message Descriptor (MQMD)
	// and Put Options (MQPMO). Create those with default values.

	// We are only expecting a single response, so do not need to loop through replies
	getmqmd := ibmmq.NewMQMD()
	gmo := ibmmq.NewMQGMO()

	gmo.Options = ibmmq.MQGMO_WAIT | ibmmq.MQGMO_FAIL_IF_QUIESCING
	// Wait for up to 10 seconds in case the responder is not running yet
	gmo.WaitInterval = 10 * 1000 // The WaitInterval is in milliseconds

	// Setup the way to match the correct field in the MQMD
	gmo.MatchOptions = ibmmq.MQMO_MATCH_CORREL_ID
	getmqmd.CorrelId = correlId

	logger.Println("Looking for a match on CorrelId:" + hex.EncodeToString(correlId))

	// Create a buffer for the message data. This one is large enough
	// for the messages put by the amqsput sample.
	buffer := make([]byte, 1024)

	// Now try to get the message
	datalen, err = qDynamicObject.Get(getmqmd, gmo, buffer)

	if err != nil {
		logError(err)
	} else {
		// Assume the message is a printable string
		logger.Printf("Got message of length %d: ", datalen)
		logger.Println("  " + strings.TrimSpace(string(buffer[:datalen])))
	}
}
