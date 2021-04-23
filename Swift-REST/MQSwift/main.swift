/**
 * Copyright 2021 IBM Corp.
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

import Foundation

// Determine the execution settings based on command line arguments,
// envrionment json file, and environment settings.
var envData = EnvData()
guard (envData.loadEnv()) else {
    print("Run or Environment settings in error")
    exit(1)
}

print("Envrionment settings have been loaded")

// Verify that the execution settings are as expected
guard(envData.isValid()) else {
    print("Envrionment data is invalid!")
    exit(1)
}

// Set up the closure through which we will examine the REST call response.
let responseHandler : OurTypes.ResHandler = {
    data, response, error in
    print("Looking at response data")
    print("Error:")
    print(error ?? "No Error")
    print("Response")
    print(response ?? "No Response")
    print("Data:")
    print(data ?? "No Data")
    if let data = data {
        print("invoking parseDataFile")
        let dataHandler = ResponseDataHandler()
        dataHandler.parseDataFile(data: data)
    }
}

// Get hold of our REST request object
let requestManager = HTTPRequestManager.sharedInstance

// Invoke appropriate REST call
switch envData.mode {
case .put:
    print("Perfroming MQ Put")
    requestManager.postRequest(envData: envData, dataHandler: responseHandler)
case .get:
    print("Performing MQ Get")
    requestManager.deleteRequest(envData: envData, dataHandler: responseHandler)
case .none:
    print("Missing mode")
}

// REST response will return asynchronously, so need to pause to keep application running in
// order to receive response
print("Waiting to allow asynchronous requests to complete")
sleep(10)
print("Exiting!")



