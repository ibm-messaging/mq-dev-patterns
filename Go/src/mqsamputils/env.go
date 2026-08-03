/**
 * Copyright 2018, 2026 IBM Corp.
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
	"encoding/json"
	"io"
	"log"
	"os"
	"strconv"
	"strings"
)

var logger = log.New(os.Stdout, "Config: ", log.LstdFlags)

type Env struct {
	User             string `json:"APP_USER"`
	Password         string `json:"APP_PASSWORD"`
	QManager         string `json:"QMGR"`
	QueueName        string `json:"QUEUE_NAME"`
	ModelQueueName   string `json:"MODEL_QUEUE_NAME"`
	DynamicQueueName string `json:"DYNAMIC_QUEUE_PREFIX"`
	BackoutQueue     string `json:"BACKOUT_QUEUE"`
	Host             string `json:"HOST"`
	Port             string `json:"PORT"`
	Channel          string `json:"CHANNEL"`
	Topic            string `json:"TOPIC_NAME"`
	KeyRepository    string `json:"KEY_REPOSITORY"`
	Cipher           string `json:"CIPHER"`

	//JWT variables
	JwtTokenEndpoint string `json:"JWT_TOKEN_ENDPOINT"`
	JwtTokenUsername string `json:"JWT_TOKEN_USERNAME"`
	JwtTokenPwd      string `json:"JWT_TOKEN_PWD"`
	JwtTokenClientID string `json:"JWT_TOKEN_CLIENTID"`
	JwtKeyRepository string `json:"JWT_KEY_REPOSITORY"`
}

type MQEndpoints struct {
	Points []Env `json:"MQ_ENDPOINTS"`
}

type JwtEndpoints struct {
	Points []Env `json:"JWT_ISSUER"`
}

var EnvSettings Env
var JwtSettings Env
var MQ_ENDPOINTS MQEndpoints
var JWT_ISSUER JwtEndpoints

const FULL_STRING = -1
const DEFAULT_CONFIG_FILE = "../../env.json"

// Using "init" as the function name gets it invoked automatically on application startup
func init() {

	f := os.Getenv("CONFIG_JSON_FILE")
	if f == "" {
		f = DEFAULT_CONFIG_FILE
	}
	jsonFile, err := os.Open(f)
	if err != nil {
		logger.Println(err)
		return
	}

	defer jsonFile.Close()

	logger.Printf("Successfully opened %s", f)

	byteValue, _ := io.ReadAll(jsonFile)
	json.Unmarshal(byteValue, &MQ_ENDPOINTS)
	json.Unmarshal(byteValue, &JWT_ISSUER)

	// The env.json should have supplied the MQ endpoints as an array.
	// If there are no elements, then EnvSettings will be default
	// initialised to be empty.

	if len(JWT_ISSUER.Points) > 0 {
		jwt := JWT_ISSUER.Points[0] // Extract JWT config

		EnvSettings.JwtTokenEndpoint = jwt.JwtTokenEndpoint
		EnvSettings.JwtTokenUsername = jwt.JwtTokenUsername
		EnvSettings.JwtTokenPwd = jwt.JwtTokenPwd
		EnvSettings.JwtTokenClientID = jwt.JwtTokenClientID
		EnvSettings.JwtKeyRepository = jwt.JwtKeyRepository
	}

	environmentOverides()

	if len(MQ_ENDPOINTS.Points) > 0 {
		EnvSettings = MQ_ENDPOINTS.Points[0]
	}

}

func environmentOverides() {
	logger.Println("Looking for environment overrides")

	for i := 0; i < len(MQ_ENDPOINTS.Points); i++ {
		// Environment variables can override all of the endpoints in the Points array.
		// So we have to check all of the available objects in turn.
		overrides := map[string]*string{
			// Main connection information
			"APP_USER":             &MQ_ENDPOINTS.Points[i].User,
			"APP_PASSWORD":         &MQ_ENDPOINTS.Points[i].Password,
			"QMGR":                 &MQ_ENDPOINTS.Points[i].QManager,
			"QUEUE_NAME":           &MQ_ENDPOINTS.Points[i].QueueName,
			"MODEL_QUEUE_NAME":     &MQ_ENDPOINTS.Points[i].ModelQueueName,
			"DYNAMIC_QUEUE_PREFIX": &MQ_ENDPOINTS.Points[i].DynamicQueueName,
			"BACKOUT_QUEUE":        &MQ_ENDPOINTS.Points[i].BackoutQueue,
			"HOST":                 &MQ_ENDPOINTS.Points[i].Host,
			"PORT":                 &MQ_ENDPOINTS.Points[i].Port,
			"CHANNEL":              &MQ_ENDPOINTS.Points[i].Channel,
			"TOPIC_NAME":           &MQ_ENDPOINTS.Points[i].Topic,
			"KEY_REPOSITORY":       &MQ_ENDPOINTS.Points[i].KeyRepository,
			"CIPHER":               &MQ_ENDPOINTS.Points[i].Cipher,

			//JWT variables
			"JWT_TOKEN_ENDPOINT": &MQ_ENDPOINTS.Points[i].JwtTokenEndpoint,
			"JWT_TOKEN_USERNAME": &MQ_ENDPOINTS.Points[i].JwtTokenUsername,
			"JWT_TOKEN_PWD":      &MQ_ENDPOINTS.Points[i].JwtTokenPwd,
			"JWT_TOKEN_CLIENTID": &MQ_ENDPOINTS.Points[i].JwtTokenClientID,
			"JWT_KEY_REPOSITORY": &MQ_ENDPOINTS.Points[i].JwtKeyRepository,
		}

		// Use LookupEnv instead of Getenv so we can tell if the environment variable has been explicitly set to an empty string
		// rather than being unset
		for f, v := range overrides {
			// A "bare" environment variable name will apply to all entries in the list
			s, b := os.LookupEnv(f)
			if b {
				//logger.Printf("Setting overide for %s", f)
				*v = s
			}

			// But we also allow index-specific environment variable overrides by appending an index eg QMANAGER_1
			s, b = os.LookupEnv(f + "_" + strconv.Itoa(i))
			if b {
				//logger.Printf("Setting overide for %s on entry %d", f, i)
				*v = s
			}
		}
	}
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
	logger.Println("Configuration settings are")
	logger.Printf("  Username       : %s", EnvSettings.User)
	//logger.Printf("  Password : %s", EnvSettings.Password)
	logger.Printf("  Queue Manager  : %s", EnvSettings.QManager)
	logger.Printf("  Queue Name     : %s", EnvSettings.QueueName)
	logger.Printf("  Model Queue    : %s", EnvSettings.ModelQueueName)
	logger.Printf("  Backout Queue  : %s", EnvSettings.BackoutQueue)
	logger.Printf("  Host           : %s", EnvSettings.Host)
	logger.Printf("  Port           : %s", EnvSettings.Port)
	logger.Printf("  Connection     : %s", EnvSettings.GetConnection(FULL_STRING))
	logger.Printf("  Channel        : %s", EnvSettings.Channel)
	logger.Printf("  Topic          : %s", EnvSettings.Topic)
	logger.Printf("  Key Repository : %s", EnvSettings.KeyRepository)
	logger.Printf("  Cipher         : %s", EnvSettings.Cipher)

	if len(JWT_ISSUER.Points) > 0 {
		logger.Println("JWT configuration settings are")
		logger.Printf("  Token Endpoint : %s", EnvSettings.JwtTokenEndpoint)
		logger.Printf("  Token Username : %s", EnvSettings.JwtTokenUsername)
		//logger.Printf("JWT_TOKEN_PWD : %s", EnvSettings.JWT_TOKEN_PWD)
		logger.Printf("  Token ID       : %s", EnvSettings.JwtTokenClientID)
		logger.Printf("  Key Repository : %s", EnvSettings.JwtKeyRepository)
	}

}
