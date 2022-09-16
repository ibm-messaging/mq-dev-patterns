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
	"bytes"
	"encoding/hex"
	"encoding/json"
	"log"
	"github.com/ibm-messaging/mq-golang/v5/ibmmq"
	"mqdevpatterns/src/mqsamputils"
	"os"
	"strings"
	"time"
	//"errors"
)

var logger = log.New(os.Stdout, "MQ Response: ", log.LstdFlags)

type message struct {
	Greeting  string `json:"greeting"`
	Message   string `json:"message"`
	Value     int    `json:"value"`
	MSGCorrID string `json:"correlationID"`
}

// Main Entry to response application
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

	qObject, err := mqsamputils.OpenQueue(qMgr, mqsamputils.Get)
	if err != nil {
		logger.Fatalln("Unable to Open Queue")
		os.Exit(1)
	}
	defer qObject.Close(0)

	

	getMessages(qMgr, qObject)

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

func getMessages(qMgr ibmmq.MQQueueManager, qObject ibmmq.MQObject) {
	logger.Println("Getting Message from queue")
	var err error

	ok := true
	running := true

	for running {
		var datalen int
		// The PUT requires control structures, the Message Descriptor (MQMD)
		// and Put Options (MQPMO). Create those with default values.
		getmqmd := ibmmq.NewMQMD()
		gmo := ibmmq.NewMQGMO()

		// The default options are OK, but it's always
		// a good idea to be explicit about transactional boundaries as
		// not all platforms behave the same way.
		// Get Request with syncpoint
		gmo.Options = ibmmq.MQGMO_SYNCPOINT | ibmmq.MQGMO_WAIT | ibmmq.MQGMO_FAIL_IF_QUIESCING

		// Set options to wait for a maximum of 3 seconds for any new message to arrive
		gmo.WaitInterval = 3 * 1000 // The WaitInterval is in milliseconds
		// Create a buffer for the message data. This one is large enough
		// for the messages put by the amqsput sample.
		buffer := make([]byte, 1024)						
		// Now try to get the message
		datalen, err = qObject.Get(getmqmd, gmo, buffer)

		if err !=nil {
			mqret := err.(*ibmmq.MQReturn)		

			if mqret.MQRC == ibmmq.MQRC_NO_MSG_AVAILABLE {
				ok = true
			} else {
				ok = false
			}	

		} else {
			// Assume the message is a printable string
			logger.Printf("Got message of length %d: ", datalen)
			logger.Println(string(buffer[:datalen]))
			qObject, err := mqsamputils.OpenDynamicQueue(qMgr, getmqmd.ReplyToQ)	

			if err != nil {
				logger.Println("Unable to Open Queue")				
				ok=false				
			} else {
				err = replyToMsg(qObject, string(buffer[:datalen]), getmqmd)
				if err != nil {							
					ok=false				
				} 
			}		

		}

		if ok {
			qMgr.Cmit()
			logger.Println("Response message commited!")			
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
	if counter >=5 {
		qObject, err := mqsamputils.OpenDynamicQueue(qMgr, BACKOUT_QUEUE)

		if err!=nil {
			logger.Println("Error on opening the backout queue")
			ok = false
		} else {
			replyToMsg(qObject, string(buffer[:datalen]), getmqmd)			
			qMgr.Cmit()
			logger.Println("Message delivered to the backout queue " , BACKOUT_QUEUE , " correctly.")			
		}

	} else {
		logger.Println("CURRENT BACKOUT COUNTER %s", string(counter))
		qMgr.Back()
	}

	return 
}

func replyToMsg(qObject ibmmq.MQObject, msg string, getmqmd *ibmmq.MQMD) error {
	logger.Println("About to reply to request ", msg)
	var messageObject message

	logger.Println("Pruned message ", msg)

	json.Unmarshal([]byte(msg), &messageObject)
	logger.Println("Found message", messageObject.Greeting)
	logger.Println("Found message", messageObject.Message)
	logger.Println("Found message", messageObject.Value)

	msgData := &message{
		Greeting: "Reply from Go is " + time.Now().Format(time.RFC3339),
		Value:    messageObject.Value * messageObject.Value}
	data, err := json.Marshal(msgData)
	if err != nil {
		logger.Println("Unexpected error marshalling data to send")
		logError(err)
		return err
	}

	putmqmd := ibmmq.NewMQMD()
	pmo := ibmmq.NewMQPMO()

	emptyByteArray := make([]byte, 24)

	if bytes.Equal(getmqmd.CorrelId, emptyByteArray) || bytes.Contains(getmqmd.CorrelId, emptyByteArray) {
		logger.Println("CorrelId is empty")
		putmqmd.CorrelId = getmqmd.MsgId
	} else {
		logger.Println("Correl ID found on request")

		putmqmd.CorrelId = getmqmd.CorrelId
	}

	putmqmd.MsgId = getmqmd.MsgId

	// Tell MQ what the message body format is.
	// In this case, a text string
	putmqmd.Format = ibmmq.MQFMT_STRING

	logger.Println("Looking for match on Correl ID CorrelID:" + hex.EncodeToString(putmqmd.CorrelId))

	logger.Println("Looking for match on Correl ID CorrelID:" + string(putmqmd.CorrelId))

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
	return nil
}
