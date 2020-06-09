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

var logger = log.New(os.Stdout, "MQ Request: ", log.LstdFlags)

type message struct {
	Greeting string `json:"greeting"`
	Value    int    `json:"value"`
}

// Main Entry to request application
// Creates Connection to Queue
func main() {
	logger.Println("Application is Starting")
	rand.Seed(time.Now().UTC().UnixNano())

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

	qObjDynamic, err := mqsamputils.OpenQueue(qMgr, mqsamputils.Dynamic)
	if err != nil {
		logger.Fatalln("Unable to Open Dynamic Queue")
		os.Exit(1)
	}
	defer qObjDynamic.Close(0)

	corellationId, err := putMessage(qObject, qObjDynamic)
	if err != nil {
		logger.Fatalln("Unable to send request")
		os.Exit(1)
	}

	awaitResponse(qObjDynamic, corellationId)

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

func putMessage(qObject ibmmq.MQObject, qDynamicObject ibmmq.MQObject) ([]byte, error) {
	logger.Println("Writing Message to Queue")
	var corellationId []byte

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
		logger.Println("Unexpected error marhalling data to send")
		logError(err)
		return corellationId, err
	}

	// The message is always sent as bytes, so has to be converted before the PUT.

	// Now put the message to the queue
	logger.Printf("Sending message %s", data)
	err = qObject.Put(putmqmd, pmo, data)

	if err != nil {
		logError(err)
	} else {
		logger.Println("Put message to", strings.TrimSpace(qObject.Name))

		logger.Println("MsgId:" + hex.EncodeToString(putmqmd.MsgId))
		logger.Println("CorrelID:" + hex.EncodeToString(putmqmd.CorrelId))
		corellationId = putmqmd.CorrelId
	}
	return corellationId, err
}

func awaitResponse(qDynamicObject ibmmq.MQObject, correlId []byte) {
	logger.Println("Waiting for a response")
	var err error
	msgAvail := true

	for msgAvail == true && err == nil {
		var datalen int

		// The PUT requires control structures, the Message Descriptor (MQMD)
		// and Put Options (MQPMO). Create those with default values.
		getmqmd := ibmmq.NewMQMD()
		gmo := ibmmq.NewMQGMO()

		// The default options are OK, but it's always
		// a good idea to be explicit about transactional boundaries as
		// not all platforms behave the same way.
		gmo.Options = ibmmq.MQGMO_WAIT | ibmmq.MQGMO_FAIL_IF_QUIESCING
		// Set options to wait for a maximum of 10 seconds for any new message to arrive
		gmo.MatchOptions = ibmmq.MQMO_MATCH_CORREL_ID

		getmqmd.CorrelId = correlId

		gmo.WaitInterval = 10 * 1000 // The WaitInterval is in milliseconds

		logger.Println("Looking for match on Correl ID CorrelID:" + hex.EncodeToString(correlId))

		// Create a buffer for the message data. This one is large enough
		// for the messages put by the amqsput sample.
		buffer := make([]byte, 1024)

		// Now try to get the message
		datalen, err = qDynamicObject.Get(getmqmd, gmo, buffer)

		if err != nil {
			msgAvail = false
			logger.Println(err)
			mqret := err.(*ibmmq.MQReturn)
			logger.Printf("return code %d, expected %d,", mqret.MQRC, ibmmq.MQRC_NO_MSG_AVAILABLE)
			if mqret.MQRC == ibmmq.MQRC_NO_MSG_AVAILABLE {
				// If there's no message available, then don't treat that as a real error as
				// it's an expected situation
				msgAvail = true
				err = nil
			}
		} else {
			// Assume the message is a printable string
			logger.Printf("Got message of length %d: ", datalen)
			logger.Println(strings.TrimSpace(string(buffer[:datalen])))
			msgAvail = false
		}
	}
}
