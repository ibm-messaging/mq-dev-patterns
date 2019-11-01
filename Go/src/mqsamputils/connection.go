/**
 * Copyright 2019 IBM Corp.
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

package mqsamputils

import (
	"mq-golang/ibmmq"
)

const (
	Put      = "PUT"
	Get      = "GET"
	Pub      = "PUB"
	Dynamic  = "Dynamic"
	Response = "Response"
)

// Package logging already set in the env.go module, so no need to
// add it here also.

// Establishes the connection to the MQ Server. Returns the
// Queue Manager if successful
func CreateConnection() (ibmmq.MQQueueManager, error) {
	logger.Println("Setting up Connection to MQ")
	// Allocate the MQCNO and MQCD structures needed for the CONNX call.
	cno := ibmmq.NewMQCNO()
	cd := ibmmq.NewMQCD()

	// Fill in required fields in the MQCD channel definition structure
	cd.ChannelName = EnvSettings.Channel
	cd.ConnectionName = EnvSettings.GetConnection()

	if username := EnvSettings.User; username != "" {
		logger.Printf("User %s has been specified\n", username)
		csp := ibmmq.NewMQCSP()
		csp.AuthenticationType = ibmmq.MQCSP_AUTH_USER_ID_AND_PWD
		csp.UserId = username
		csp.Password = EnvSettings.Password

		// Make the CNO refer to the CSP structure so it gets used during the connection
		cno.SecurityParms = csp
	}

	if EnvSettings.KeyRepository != "" {
		logger.Println("Running in TLS Mode")
		sco := ibmmq.NewMQSCO()
		cd.SSLCipherSpec = EnvSettings.Cipher
		cd.SSLClientAuth = ibmmq.MQSCA_OPTIONAL
		sco.KeyRepository = EnvSettings.KeyRepository
		
		cno.SSLConfig = sco
	}

	// Reference the CD structure from the CNO and indicate that we definitely want to
	// use the client connection method.
	cno.ClientConn = cd
	cno.Options = ibmmq.MQCNO_CLIENT_BINDING

	// And now we can try to connect. Wait a short time before disconnecting.
	logger.Printf("Attempting connection to %s", EnvSettings.QManager)
	qMgr, err := ibmmq.Connx(EnvSettings.QManager, cno)
	if err == nil {
		logger.Println("Connection succeeded")
	} else {
		logError(err)
	}
	return qMgr, err
}

// Opens a Dynamic Queue as part of a response in a request / response pattern
func OpenDynamicQueue(qMgrObject ibmmq.MQQueueManager, queueName string) (ibmmq.MQObject, error) {
	return openQueue(qMgrObject, queueName, Response)
}

// Opens the queue. No queueName is provided.
func OpenQueue(qMgrObject ibmmq.MQQueueManager, msgStyle string) (ibmmq.MQObject, error) {
	return openQueue(qMgrObject, "", msgStyle)
}

// Internal function to allow it to be modified, without affecting the callers.
func openQueue(qMgrObject ibmmq.MQQueueManager, replyToQ string, msgStyle string)  (ibmmq.MQObject, error) {
	// Create the Object Descriptor that allows us to give the queue name
	mqod := ibmmq.NewMQOD()
	// We have to say how we are going to use this queue. In this case, to PUT
	// messages. That is done in the openOptions parameter

	openOptions := ibmmq.MQOO_OUTPUT

	// Opening a QUEUE (rather than a Topic or other object type) and give the name
	switch msgStyle {
	case Put:
		mqod.ObjectType = ibmmq.MQOT_Q
		mqod.ObjectName = EnvSettings.QueueName
	case Get:
		openOptions = ibmmq.MQOO_INPUT_EXCLUSIVE
		mqod.ObjectType = ibmmq.MQOT_Q
		mqod.ObjectName = EnvSettings.QueueName
	case Pub:
		mqod.ObjectType = ibmmq.MQOT_TOPIC
		mqod.ObjectString = EnvSettings.Topic
	case Dynamic:
		openOptions = ibmmq.MQOO_INPUT_EXCLUSIVE
		mqod.ObjectName = EnvSettings.ModelQueueName
		mqod.DynamicQName = EnvSettings.DynamicQueueName
	case Response:
		mqod.ObjectType = ibmmq.MQOT_Q
		mqod.ObjectName = replyToQ
	}

	logger.Printf("Attempting open queue/topic %s", EnvSettings.QueueName)
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
