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
	"log"
	"github.com/ibm-messaging/mq-golang/v5/ibmmq"
	"mqdevpatterns/src/mqsamputils"
	"os"
	"strings"
)

var logger = log.New(os.Stdout, "MQ Get: ", log.LstdFlags)

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

	numConnections := mqsamputils.EnvSettings.GetConnectionCount()
	logger.Printf("There are %d connections", numConnections)

	for i := 0; i < numConnections; i++ {
		qMgr, err := mqsamputils.CreateConnection(i)
		defer qMgr.Disc()
		if err != nil {
			mqret := err.(*ibmmq.MQReturn)
			if mqret.MQRC == ibmmq.MQRC_Q_MGR_NOT_AVAILABLE {
				logger.Println("Queue Manager not available, skipping this endpoint")
				continue
			} else {
				logger.Fatalln("Unable to Establish Connection to server")
				os.Exit(1)
			}
		}

		qObject, err := mqsamputils.OpenGetQueue(qMgr, mqsamputils.Get, i)
		if err != nil {
			logger.Fatalln("Unable to Open Queue")
			os.Exit(1)
		}
		defer qObject.Close(0)

		getMessage(qObject)

		// Need to Close the Queue and Connection so can be reused for next iteration
		qObject.Close(0)
		qMgr.Disc()

	}

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

func getMessage(qObject ibmmq.MQObject) {
	logger.Println("Getting Message from Queue")
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
			logger.Println(err)
			mqret := err.(*ibmmq.MQReturn)
			logger.Printf("return code %d, expected %d,", mqret.MQRC, ibmmq.MQRC_NO_MSG_AVAILABLE)
			if mqret.MQRC == ibmmq.MQRC_NO_MSG_AVAILABLE {
				// If there's no message available, then don't treat that as a real error as
				// it's an expected situation
				// but do end loop so can pull messages from next endpoint
				// msgAvail = true
				err = nil
				logger.Println("No more messages on this endpoint")
			}
		} else {
			// Assume the message is a printable string
			logger.Printf("Got message of length %d: ", datalen)
			logger.Println(strings.TrimSpace(string(buffer[:datalen])))

		}
	}
}
