/**
 * © Copyright IBM Corporation 2020
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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

package mqsamputils

import (
	"os"
	"strings"

	"github.com/ibm-messaging/mq-golang/v5/ibmmq"
)

const (
	Put        = "PUT"
	Get        = "GET"
	Pub        = "PUB"
	Dynamic    = "Dynamic"
	Response   = "Response"
	CCDT       = "MQCCDTURL"
	FILEPREFIX = "file://"
)

// Package logging already set in the env.go module, so no need to
// add it here also.

func getEndPoint(index int) Env {
	if index == FULL_STRING {
		index = 0
	}
	return MQ_ENDPOINTS.Points[index]
}

func ccdtCheck() bool {
	if fPath := os.Getenv(CCDT); "" != fPath {
		ccdtFile, err := os.Open(strings.TrimPrefix(fPath, FILEPREFIX))
		defer ccdtFile.Close()
		if err == nil {
			logger.Println("CCDT File found and will be used to configure connection")
			return true
		}
		logger.Printf("CCDT File not found at %s", fPath)
		logger.Println(err)
	}
	return false
}

// Establishes the connection to the MQ Server. Returns the
// Queue Manager if successful
func CreateConnection(index int) (ibmmq.MQQueueManager, error) {
	logger.Println("Setting up Connection to MQ")

	// Allocate the MQCNO structure needed for the CONNX call.
	cno := ibmmq.NewMQCNO()
	env := getEndPoint(index)

	if username := env.User; username != "" {
		logger.Printf("User %s has been specified\n", username)
		csp := ibmmq.NewMQCSP()
		csp.AuthenticationType = ibmmq.MQCSP_AUTH_USER_ID_AND_PWD
		csp.UserId = username
		csp.Password = env.Password

		// Make the CNO refer to the CSP structure so it gets used during the connection
		cno.SecurityParms = csp

	}

	if !ccdtCheck() {
		logger.Println("CCDT URL export is not set, will be using json envrionment client connections settings")

		cd := ibmmq.NewMQCD()

		// Fill in required fields in the MQCD channel definition structure
		cd.ChannelName = env.Channel
		cd.ConnectionName = env.GetConnection(index)
		logger.Printf("Connecting to %s ", cd.ConnectionName)

		if env.KeyRepository != "" {
			logger.Println("Running in TLS Mode")

			cd.SSLCipherSpec = env.Cipher
			cd.SSLClientAuth = ibmmq.MQSCA_OPTIONAL
		}

		// Reference the CD structure from the CNO
		cno.ClientConn = cd
	}

	// The location of the KeyRepository is not specified in the CCDT, so regardless
	// of whether a CCDT is being used, need to specify the KeyRepository location
	// if it has been provided in the environment json settings.
	if env.KeyRepository != "" {
		logger.Println("Key Repository has been specified")

		sco := ibmmq.NewMQSCO()
		sco.KeyRepository = env.KeyRepository

		cno.SSLConfig = sco
	}

	// Indicate that we definitely want to use the client connection method.
	cno.Options = ibmmq.MQCNO_CLIENT_BINDING

	// And now we can try to connect. Wait a short time before disconnecting.
	logger.Printf("Attempting connection to %s", env.QManager)
	qMgr, err := ibmmq.Connx(env.QManager, cno)
	if err == nil {
		logger.Println("Connection succeeded")
	} else {
		logError(err)
	}
	return qMgr, err
}

// Opens a Dynamic Queue as part of a response in a request / response pattern
func OpenDynamicQueue(qMgrObject ibmmq.MQQueueManager, queueName string) (ibmmq.MQObject, error) {
	return openQueue(qMgrObject, queueName, Response, FULL_STRING)
}

// Opens the queue. No queueName is provided.
func OpenQueue(qMgrObject ibmmq.MQQueueManager, msgStyle string) (ibmmq.MQObject, error) {
	return openQueue(qMgrObject, "", msgStyle, FULL_STRING)
}

// Opens the queue. No queueName is provided.
func OpenGetQueue(qMgrObject ibmmq.MQQueueManager, msgStyle string, index int) (ibmmq.MQObject, error) {
	return openQueue(qMgrObject, "", msgStyle, index)
}

// Internal function to allow it to be modified, without affecting the callers.
func openQueue(qMgrObject ibmmq.MQQueueManager, replyToQ string, msgStyle string, index int) (ibmmq.MQObject, error) {
	// Create the Object Descriptor that allows us to give the queue name
	mqod := ibmmq.NewMQOD()
	// We have to say how we are going to use this queue. In this case, to PUT
	// messages. That is done in the openOptions parameter

	env := getEndPoint(index)

	openOptions := ibmmq.MQOO_OUTPUT

	// Opening a QUEUE (rather than a Topic or other object type) and give the name
	switch msgStyle {
	case Put:
		mqod.ObjectType = ibmmq.MQOT_Q
		mqod.ObjectName = env.QueueName
	case Get:
		openOptions = ibmmq.MQOO_INPUT_SHARED
		mqod.ObjectType = ibmmq.MQOT_Q
		mqod.ObjectName = env.QueueName
	case Pub:
		mqod.ObjectType = ibmmq.MQOT_TOPIC
		mqod.ObjectString = env.Topic
	case Dynamic:
		openOptions = ibmmq.MQOO_INPUT_EXCLUSIVE
		mqod.ObjectName = env.ModelQueueName
		mqod.DynamicQName = env.DynamicQueueName
	case Response:
		mqod.ObjectType = ibmmq.MQOT_Q
		mqod.ObjectName = replyToQ
	}

	logger.Printf("Attempting open queue/topic %s", env.QueueName)
	qObject, err := qMgrObject.Open(mqod, openOptions)
	if err != nil {
		logError(err)
	} else {
		logger.Println("Opened queue/topic", qObject.Name)
	}
	return qObject, err
}

func logError(err error) {
	logger.Println(err)
	logger.Printf("Error Code %v", err.(*ibmmq.MQReturn).MQCC)
}
