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
	"log"
	"mqdevpatterns/src/mqsamputils"
	"os"
	"strings"

	"github.com/ibm-messaging/mq-golang/v5/ibmmq"
)

var logger = log.New(os.Stdout, "MQ Get: ", log.LstdFlags)

type message struct {
	Greeting string `json:"greeting"`
	Value    int    `json:"value"`
}

// Main entry to Get application
// Creates connection to Queue Manager
func main() {

	logger.Println("Application is starting")

	mqsamputils.EnvSettings.LogSettings()

	qMgr, err := mqsamputils.CreateConnection(mqsamputils.FULL_STRING)
	if err != nil {
		logger.Fatalln("Unable to establish connection to server")
	}
	defer qMgr.Disc()

	qObject, err := openQueue(qMgr)
	if err != nil {
		logger.Fatalln("Unable to open queue")
	}
	defer qObject.Close(0)

	getMessage(qObject)

	logger.Println("Application is ending")
}

func openQueue(qMgr ibmmq.MQQueueManager) (ibmmq.MQObject, error) {
	// Create the Object Descriptor that allows us to give the queue name
	mqod := ibmmq.NewMQOD()
	mqod.ObjectType = ibmmq.MQOT_Q
	mqod.ObjectName = mqsamputils.EnvSettings.QueueName

	openOptions := ibmmq.MQOO_INPUT_EXCLUSIVE

	logger.Printf("Attempting to open queue %s", mqod.ObjectName)
	qObject, err := qMgr.Open(mqod, openOptions)

	if err != nil {
		logError(err)
	} else {
		logger.Printf("Opened object %s", qObject.Name)
	}

	return qObject, err
}

func logError(err error) {
	logger.Println(err)
	os.Exit(1)
}

func getMessage(qObject ibmmq.MQObject) {
	logger.Println("Getting message from queue")
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
		gmo.Options = ibmmq.MQGMO_NO_SYNCPOINT

		// Set options to wait for a maximum of 3 seconds for any new message to arrive
		gmo.Options |= ibmmq.MQGMO_WAIT
		gmo.WaitInterval = 3 * 1000 // The WaitInterval is in milliseconds

		// Create a buffer for the message data. This one is large enough
		// for the messages put by the amqsput sample.
		buffer := make([]byte, 1024)

		// Now try to get the message
		datalen, err = qObject.Get(getmqmd, gmo, buffer)

		if err != nil {
			msgAvail = false

			mqret := err.(*ibmmq.MQReturn)
			if mqret.MQRC == ibmmq.MQRC_NO_MSG_AVAILABLE {
				// If there's no message available, then don't treat that as a real error as
				// it's an expected situation. But we still use it as an opportunity to exit.
				err = nil
				logger.Println("No more messages on this endpoint")
			} else {
				logError(err)
			}
		} else {
			// Assume the message is a printable string
			logger.Printf("Got message of length %d: ", datalen)
			logger.Println("  " + strings.TrimSpace(string(buffer[:datalen])))
		}
	}
}
