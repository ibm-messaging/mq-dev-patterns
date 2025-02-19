package mqsamputils

/**
 * Copyright 2025 IBM Corp.
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

// This sample is based on ibm-messaging/mq-golang/samples/amqsjwt.go 


import (
	"crypto/tls"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
	"encoding/json"
	"io/ioutil"
	"github.com/ibm-messaging/mq-golang/v5/ibmmq"
	"crypto/x509" 
)


type Config struct {
	qMgrName       string
	connectionName string
	channel        string
	JwtTokenEndpoint      string
	JwtTokenUsername  string
	JwtTokenPwd  string
	JwtTokenClientID  string
	tokenRealm     string
}


// We only care about one field in the JSON data returned from
// the call to the JWT server
type JWTResponse struct {
	AccessToken string `json:"access_token"`
}

var cf Config
var jwtResponseStruct JWTResponse


func getJwtEndPoint(index int) (Env) {

	if index == FULL_STRING {
		index = 0
	}
	
	return JWT_ISSUER.Points[index]
}

func JwtCheck() bool {
	if len(JWT_ISSUER.Points) == 0 {
		logger.Println("JWT credentials not found, will not be using JWT to authenticate")
		return false;
	}

	jwt := getJwtEndPoint(FULL_STRING)
	
	if jwt.JwtTokenEndpoint == "" || jwt.JwtTokenUsername == "" || jwt.JwtTokenPwd == "" || jwt.JwtTokenClientID == "" {
		logger.Println("One or more JWT credentials missing, will not be using JWT to authenticate")
		return false;
	}

	
	logger.Println("JWT credentials found, will be using JWT to authenticate")
	return true;

}

func ConnectViaJwt(env Env, jwt Env) (ibmmq.MQQueueManager, error){
	var err error
	var qMgr ibmmq.MQQueueManager
	var rc int

	//DEBUG: to avoid declared and not used 
	_ = rc

	token := ""


	// Allocate the MQCNO and MQCD structures needed for the CONNX call.
	cno := ibmmq.NewMQCNO()
	cd := ibmmq.NewMQCD()


	// Fill in required fields in the MQCD channel definition structure
	cd.ChannelName = env.Channel
	cd.ConnectionName = env.GetConnection(FULL_STRING)

	// Reference the CD structure from the CNO and indicate that we definitely want to
	// use the client connection method.
	cno.ClientConn = cd
	cno.Options = ibmmq.MQCNO_CLIENT_BINDING

	token, err = ObtainToken(jwt, env)
	if err == nil {
		if token != "" {
			csp := ibmmq.NewMQCSP()
			csp.Token = token
			fmt.Printf("Using token: %s\n", token)

			// Make the CNO refer to the CSP structure so it gets used during the connection
			cno.SecurityParms = csp
		} else {
			fmt.Printf("An empty token was returned")
			os.Exit(1)
		}
	} else {
		fmt.Printf("Could not get token: error %v\n", err)
		os.Exit(1)
	}

	// And now we can try to connect. Wait a short time before disconnecting.
	qMgr, err = ibmmq.Connx(env.QManager, cno)
	if err == nil {
		fmt.Printf("MQCONN to QM %s succeeded.\n", env.QManager)
		d, _ := time.ParseDuration("3s")
		time.Sleep(d)
		//qMgr.Disc() // Ignore errors from disconnect as we can't do much about it anyway
		//rc = 0 //Ignore exit in this function
	} else {
		fmt.Printf("MQCONN to %s failed.\n", env.QManager)
		fmt.Println(err)
		//rc = int(err.(*ibmmq.MQReturn).MQCC) //Ignore exit in this function 
	}

	fmt.Println("Done.")
	return qMgr, err
	//os.Exit(rc) //Ignore exit in this function 
}

/*
 * Function to query a token from the token endpoint. Build the
 * command that is used to retrieve a JSON response from the token
 * server. Parse the response to find the token to be added into the MQCSP.
 */
func ObtainToken(jwt Env, env Env) (string, error) {
	var resp *http.Response
	var tr *http.Transport

	/*
	   This curl command is the basis of the call to get a token. It uses form data to
	   set the various parameters

	   curl -k -X POST "https://$host:$port/realms/$realm/protocol/openid-connect/token" \
	        -H "Content-Type: application/x-www-form-urlencoded" \
	        -d "username=$user" -d "password=$password" \
	        -d "grant_type=password" -d "client_id=$cid" \
	        -o $output -Ss
	*/

	/*
	   NOTE 1: The SkipVerify is is not a good idea for production, but it means we don't need to
	   set up a truststore for the token server's certificate. We will simply trust it - useful if it's a
	   development-level server with a self-signed cert.

	   NOTE 2: If you do choose to set up a truststore/keystore for the connection to the token server,
	   then they must be in a suitable format for OpenSSL (such as pem, p12), not the kdb format usually
	   used for an MQ connection.
	*/


	// checking for JWT authentication with JWKS

	if env.KeyRepository != "" {
		caCertPath := fmt.Sprintf(env.KeyRepository)
		caCert, err := ioutil.ReadFile(caCertPath)
		if err != nil {
			logger.Println("Failed to read CA certificate: %v", err)
		}

		// Create a certificate pool and add the CA cert
		caCertPool := x509.NewCertPool()
		if !caCertPool.AppendCertsFromPEM(caCert) {
			logger.Println("Failed to append CA certificate")
		}

		// Configure TLS with the custom CA
		tlsConfig := &tls.Config{
			RootCAs: caCertPool,
		}

		tr = &http.Transport{TLSClientConfig: tlsConfig}
	} else {
		tr = &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: false}}
	}
	
	client := &http.Client{Transport: tr}

	// Build the URL. .
	endpoint := fmt.Sprintf(jwt.JwtTokenEndpoint)
	logger.Println("DEBUG: this is the JWT issuer endpoint")
	logger.Println(endpoint)

	// Fill in the pieces of data that the server expects
	formData := url.Values{
		"username":   {jwt.JwtTokenUsername},
		"password":   {jwt.JwtTokenPwd},
		"client_id":  {jwt.JwtTokenClientID},
		"grant_type": {"password"},
	}

	req, err := http.NewRequest("POST", endpoint, strings.NewReader(formData.Encode()))

	// And make the call to the token server
	if err == nil {
		req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
		resp, err = client.Do(req)
	}

	if err != nil {
		// we will get an error at this stage if the request fails, such as if the
		// requested URL is not found, or if the server is not reachable.
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		err = fmt.Errorf("status code error: %d %s", resp.StatusCode, resp.Status)
		return "", err
	}

	// If it all worked, we can parse the response. We don't need all of the returned
	// fields, only the token.
	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	} else {
		// fmt.Printf("Got back a response: %s\n", data)
		err = json.Unmarshal(data, &jwtResponseStruct)
	}

	return jwtResponseStruct.AccessToken, err
}