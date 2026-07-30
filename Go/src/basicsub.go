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

var logger = log.New(os.Stdout, "MQ Sub: ", log.LstdFlags)

type message struct {
	Greeting string `json:"greeting"`
	Value    int    `json:"value"`
}

// Main entry to application
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

	qObject, subscriptionObject, err := subscribeToTopic(qMgr)
	if err != nil {
		logger.Fatalln("Unable to subscribe to topic")
		os.Exit(1)
	}
	defer subscriptionObject.Close(0)
	defer qObject.Close(0)

	err = getMessage(qObject)

	logger.Println("Application is ending")
	if err != nil {
		os.Exit(1)
	}
	os.Exit(0)

}

func logError(err error) {
	logger.Println(err)
	os.Exit(1)
}

func subscribeToTopic(qMgrObject ibmmq.MQQueueManager) (ibmmq.MQObject, ibmmq.MQObject, error) {
	var qObject ibmmq.MQObject

	// Create the Object Descriptor that allows us to give the topic
	mqsd := ibmmq.NewMQSD()

	// We have to say how we are going to use this subscription. The most important flags
	// here say that
	// a) the subscription is non-durable (it will be automatically removed at the end of the program)
	// b) the queue manager will automatically manage creation and deletion of the queue
	// where publications are delivered
	mqsd.Options = ibmmq.MQSO_CREATE | ibmmq.MQSO_NON_DURABLE | ibmmq.MQSO_MANAGED

	// When opening a Subscription, MQ has a choice of whether to refer to
	// the object through an ObjectName value or the ObjectString value or both.
	// For simplicity, here we work with just the ObjectString
	mqsd.ObjectString = mqsamputils.EnvSettings.Topic

	// The qObject is filled in with a reference to the queue created automatically
	// for publications. It will be used in a moment for the Get operations
	subscriptionObject, err := qMgrObject.Sub(mqsd, &qObject)
	if err != nil {
		logError(err)
	} else {
		logger.Printf("Subscription made to topic %s", mqsamputils.EnvSettings.Topic)
	}
	return qObject, subscriptionObject, err

}

func getMessage(qObject ibmmq.MQObject) error {
	logger.Printf("Getting message from queue")
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
		// for the messages put by the samples in this directory.
		buffer := make([]byte, 1024)

		// Now we can try to get the message
		datalen, err = qObject.Get(getmqmd, gmo, buffer)

		if err != nil {
			msgAvail = false

			mqret := err.(*ibmmq.MQReturn)
			if mqret.MQRC == ibmmq.MQRC_NO_MSG_AVAILABLE {
				// If there's no message available, then don't treat that as a real error as
				// it's an expected situation. But we use it as the opportunity to quit this program
				err = nil
			} else {
				logger.Println(err)
			}
		} else {
			// Assume the message is a printable string
			logger.Printf("Got message of length %d: ", datalen)
			logger.Println("  " + strings.TrimSpace(string(buffer[:datalen])))
		}
	}

	return err
}
