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
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"strings"
)

var logger = log.New(os.Stdout, "Env: ", log.LstdFlags)

type Env struct {
	User             string `json:"APP_USER"`
	Password         string `json:"APP_PASSWORD"`
	QManager         string `json:"QMGR"`
	QueueName        string `json:"QUEUE_NAME"`
	ModelQueueName   string `json:"MODEL_QUEUE_NAME"`
	DynamicQueueName string `json:"DYNAMIC_QUEUE_PREFIX"`
	Host             string `json:"HOST"`
	Port             string `json:"PORT"`
	Channel          string `json:"CHANNEL"`
	Topic            string `json:"TOPIC_NAME"`
	KeyRepository    string `json:"KEY_REPOSITORY"`
	Cipher           string `json:"CIPHER"`
}

type MQEndpoints struct {
	Points []Env `json:"MQ_ENDPOINTS"`
}

var EnvSettings Env
var MQ_ENDPOINTS MQEndpoints

const FULL_STRING = -1

func init() {
	jsonFile, err := os.Open("env.json")
	defer jsonFile.Close()

	if err != nil {
		logger.Println(err)
		//return
	} else {
		logger.Println("Successfully Opened env.json")

		byteValue, _ := ioutil.ReadAll(jsonFile)
		json.Unmarshal(byteValue, &MQ_ENDPOINTS)
	}
	// The .json should have supplied the MQ Endpoints as an array.
	// If there are no elements, then EnvSettings will be default
	// initialised to be empty.
	if len(MQ_ENDPOINTS.Points) > 0 {
		EnvSettings = MQ_ENDPOINTS.Points[0]
	}

	environmentOverides()
}

func environmentOverides() {
	logger.Println("Looking for Environment Overrides")
	var s string

	overrides := map[string]*string{
		"APP_USER":             &EnvSettings.User,
		"APP_PASSWORD":         &EnvSettings.Password,
		"QMGR":                 &EnvSettings.QManager,
		"QUEUE_NAME":           &EnvSettings.QueueName,
		"MODEL_QUEUE_NAME":     &EnvSettings.ModelQueueName,
		"DYNAMIC_QUEUE_PREFIX": &EnvSettings.DynamicQueueName,
		"HOST":                 &EnvSettings.Host,
		"PORT":                 &EnvSettings.Port,
		"CHANNEL":              &EnvSettings.Channel,
		"TOPIC_NAME":           &EnvSettings.Topic,
		"KEY_REPOSITORY":       &EnvSettings.KeyRepository,
		"CIPHER":               &EnvSettings.Cipher,
	}

	for f, v := range overrides {
		logger.Printf("Overide for %s", f)
		s = os.Getenv(f)
		if s != "" {
			*v = s
		}
	}

	MQ_ENDPOINTS.Points = make([]Env, 1)
	MQ_ENDPOINTS.Points[0] = EnvSettings
}

func (Env) GetConnection(index int) string {
	if index == FULL_STRING {
		var connections []string
		for _, p := range MQ_ENDPOINTS.Points {
			connections = append(connections, p.Host+"("+p.Port+")")
		}
		return strings.Join(connections[:], ",")
	} else {
		p := MQ_ENDPOINTS.Points[index]
		return p.Host + "(" + p.Port + ")"
	}
}

func (Env) GetConnectionCount() int {
	return len(MQ_ENDPOINTS.Points)
}

func (Env) LogSettings() {
	logger.Println("Environment Settings are")
	logger.Printf("Username is (%s)\n", EnvSettings.User)
	//logger.Printf("Password is (%s)\n", EnvSettings.Password)
	logger.Printf("Queue Manager is (%s)\n", EnvSettings.QManager)
	logger.Printf("Queue Name is (%s)\n", EnvSettings.QueueName)
	logger.Printf("ModelQueue Name is (%s)\n", EnvSettings.ModelQueueName)
	logger.Printf("Host is (%s)\n", EnvSettings.Host)
	logger.Printf("Port is (%s)\n", EnvSettings.Port)
	logger.Printf("Connection is (%s)\n", EnvSettings.GetConnection(FULL_STRING))
	logger.Printf("Channel is (%s)\n", EnvSettings.Channel)
	logger.Printf("Topic is (%s)\n", EnvSettings.Topic)
	logger.Printf("Key Respository is (%s)\n", EnvSettings.KeyRepository)
	logger.Printf("Cipher (%s)\n", EnvSettings.Cipher)
}
