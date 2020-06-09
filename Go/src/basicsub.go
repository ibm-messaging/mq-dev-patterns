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

	qObject, subscriptionObject, err := subscribeToTopic(qMgr)
	if err != nil {
		logger.Fatalln("Unable to Open Queue")
		os.Exit(1)
	}
	defer subscriptionObject.Close(0)
	defer qObject.Close(0)

	getMessage(qObject)

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

func subscribeToTopic(qMgrObject ibmmq.MQQueueManager) (ibmmq.MQObject, ibmmq.MQObject, error) {
	var qObject ibmmq.MQObject
	// Create the Object Descriptor that allows us to give the queue name
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
		logger.Println(err)
	} else {
		logger.Println("Subscription made to topic ", mqsamputils.EnvSettings.Topic)
	}
	//defer subscriptionObject.Close(0)

	return qObject, subscriptionObject, err

}

func getMessage(qObject ibmmq.MQObject) {
	logger.Println("Writing Message to Queue")
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

		// Set options to wait for a maximum of 10 seconds for any new message to arrive
		gmo.Options |= ibmmq.MQGMO_WAIT
		gmo.WaitInterval = 10 * 1000 // The WaitInterval is in milliseconds

		// Create a buffer for the message data. This one is large enough
		// for the messages put by the amqsput sample.
		buffer := make([]byte, 1024)

		// Now we can try to get the message
		datalen, err = qObject.Get(getmqmd, gmo, buffer)

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

		}
	}
}
