/**
 * Copyright 2019, 2022 IBM Corp.
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
	"mqdevpatterns/src/mqsamputils"
	"os"
	"strings"
	"time"

	"github.com/ibm-messaging/mq-golang/v5/ibmmq"
)

var logger = log.New(os.Stdout, "MQ Rsp: ", log.LstdFlags)

type inMessage struct {
	Greeting string `json:"greeting"`
	Value    int    `json:"value"`
}

type outMessage struct {
	Greeting     string `json:"greeting"`
	SquaredValue int    `json:"squaredValue"`
}

// Main entry to response application
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

	qObject, err := openQueue(qMgr, "")
	if err != nil {
		logger.Fatalln("Unable to open queue")
	}
	defer qObject.Close(0)

	getMessages(qMgr, qObject)

	logger.Println("Application is ending")
}

func logError(err error) {
	logger.Println(err)
	os.Exit(1)
}

func openQueue(qMgr ibmmq.MQQueueManager, queueName string) (ibmmq.MQObject, error) {

	// Create the Object Descriptor that allows us to give the queue name
	mqod := ibmmq.NewMQOD()
	mqod.ObjectType = ibmmq.MQOT_Q
	mqod.ObjectName = mqsamputils.EnvSettings.QueueName

	// Assume the queue is for input unless a specific name is given. In
	// which case it's the designated reply queue
	openOptions := ibmmq.MQOO_INPUT_EXCLUSIVE
	if queueName != "" {
		mqod.ObjectName = queueName
		openOptions = ibmmq.MQOO_OUTPUT
	}
	logger.Printf("Attempting to open queue %s", mqod.ObjectName)
	qObject, err := qMgr.Open(mqod, openOptions)

	if err != nil {
		logError(err)
	} else {
		logger.Printf("Opened object %s", qObject.Name)
	}

	return qObject, err
}

func getMessages(qMgr ibmmq.MQQueueManager, qObject ibmmq.MQObject) {
	logger.Println("Getting message from queue")
	var err error

	ok := true
	running := true

	for running {
		var datalen int
		// The PUT requires control structures, the Message Descriptor (MQMD)
		// and Put Options (MQPMO). Create those with default values.
		getmqmd := ibmmq.NewMQMD()
		gmo := ibmmq.NewMQGMO()

		// Get Request with syncpoint so the reply is sent in the same transaction
		gmo.Options = ibmmq.MQGMO_SYNCPOINT | ibmmq.MQGMO_WAIT | ibmmq.MQGMO_FAIL_IF_QUIESCING

		// Set options to wait for a maximum of 3 seconds for any new message to arrive
		gmo.WaitInterval = 3 * 1000 // The WaitInterval is in milliseconds
		// Create a buffer for the message data. This one is large enough
		// for the messages put by the samples in this directory.
		buffer := make([]byte, 1024)
		// Now try to get the message
		datalen, err = qObject.Get(getmqmd, gmo, buffer)

		if err != nil {
			mqret := err.(*ibmmq.MQReturn)

			if mqret.MQRC == ibmmq.MQRC_NO_MSG_AVAILABLE {
				ok = true
				running = false
			} else {
				ok = false
			}

		} else {
			// Assume the message is a printable string
			logger.Printf("Got message of length %d: ", datalen)
			logger.Println("  " + string(buffer[:datalen]))
			qObject, err := openQueue(qMgr, getmqmd.ReplyToQ)

			if err != nil {
				logger.Println("Unable to open reply queue")
				ok = false
			} else {
				err = replyToMsg(qObject, string(buffer[:datalen]), getmqmd)
				if err != nil {
					ok = false
				}
			}

		}

		if ok {
			if running {
				qMgr.Cmit()
				logger.Println("Response message committed")
			}
		} else {
			running = PoisoningMessageHandler(qMgr, buffer, datalen, getmqmd)
		}

	}
}

func PoisoningMessageHandler(qMgr ibmmq.MQQueueManager, buffer []byte, datalen int, getmqmd *ibmmq.MQMD) (ok bool) {
	// Get the backout queue name from the env
	BACKOUT_QUEUE := mqsamputils.EnvSettings.BackoutQueue
	counter := getmqmd.BackoutCount
	ok = true

	//if counter greater then 5, redirect the message to the backout queue
	if counter >= 5 {
		qObject, err := openQueue(qMgr, BACKOUT_QUEUE)

		if err != nil {
			logger.Println("Error on opening the backout queue")
			ok = false
		} else {
			replyToMsg(qObject, string(buffer[:datalen]), getmqmd)
			qMgr.Cmit()
			logger.Printf("Message delivered to the backout queue %s correctly", BACKOUT_QUEUE)
			qObject.Close(0)
		}

	} else {
		logger.Printf("Current Backout Count: %d", counter)
		qMgr.Back()
	}

	return
}

func replyToMsg(qObject ibmmq.MQObject, msg string, getmqmd *ibmmq.MQMD) error {
	logger.Println("About to reply to request ", msg)
	var inMessageObject inMessage

	json.Unmarshal([]byte(msg), &inMessageObject)
	logger.Printf("Found message %+v", inMessageObject)

	msgData := &outMessage{
		Greeting:     "Reply from Go is " + time.Now().Format(time.RFC3339),
		SquaredValue: inMessageObject.Value * inMessageObject.Value}
	data, err := json.Marshal(msgData)
	if err != nil {
		logger.Println("Unexpected error marshalling data to send")
		logError(err)
		return err
	}

	putmqmd := ibmmq.NewMQMD()
	pmo := ibmmq.NewMQPMO()

	logger.Println("Copying inbound MsgId to outbound CorrelId")
	putmqmd.CorrelId = getmqmd.MsgId

	// Tell MQ what the message body format is.
	// In this case, a text string
	putmqmd.Format = ibmmq.MQFMT_STRING

	logger.Println("Looking for match on Correl ID CorrelID:" + hex.EncodeToString(putmqmd.CorrelId))

	// Put response with Syncpoint
	pmo.Options = ibmmq.MQPMO_SYNCPOINT

	// Now put the message to the queue
	logger.Printf("Sending message %s", data)
	err = qObject.Put(putmqmd, pmo, data)
	if err != nil {
		logError(err)
		return err
	} else {
		logger.Println("Put message to", strings.TrimSpace(qObject.Name))
		logger.Println("MsgId:" + hex.EncodeToString(putmqmd.MsgId))
	}

	// Uncomment the next line to force an error to test the backout queue processing
	// err = fmt.Errorf("Dummy error")
	return err
}
