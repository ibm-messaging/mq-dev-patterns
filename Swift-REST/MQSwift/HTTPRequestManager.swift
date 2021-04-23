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

// Class through which we will be making REST calls
class HTTPRequestManager {
    static let sharedInstance = HTTPRequestManager()
    let session: URLSession
    let sessionDelegate: HTTPRequestDelegate
    
    private  init() {
        let configuration = URLSessionConfiguration.default

        configuration.httpAdditionalHeaders =
                                 ["Accept":"application/json"]
        configuration.requestCachePolicy = .useProtocolCachePolicy
        configuration.timeoutIntervalForRequest = TimeInterval(10.0)
        
        sessionDelegate = HTTPRequestDelegate()
        session = URLSession(configuration: configuration,
                                 delegate:  sessionDelegate,
                                 delegateQueue: nil)
    }
}

extension HTTPRequestManager {
    private func setRequestSettings(on request:inout URLRequest) {
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("application/json", forHTTPHeaderField: "Accept")
        request.addValue(envData.csrfToken, forHTTPHeaderField: "ibm-mq-rest-csrf-token")
        request.addValue(envData.authString, forHTTPHeaderField: "Authorization")
        request.timeoutInterval = TimeInterval(5.0)
    }
}

extension HTTPRequestManager {
    func postRequest(envData: EnvData, dataHandler: @escaping OurTypes.ResHandler) {
        guard let url = URL(string: envData.url) else {
            print("Invalid URL")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        setRequestSettings(on: &request)
        
        let ourData = OurData()

        do {
            let data = try JSONEncoder().encode(ourData)
            request.httpBody = data
        } catch let error {
            print("Error encoding post data")
            print(error)
        }

        let task = session.dataTask(with: request, completionHandler: dataHandler)
        task.resume()
    }
    
    
    func deleteRequest(envData: EnvData, dataHandler: @escaping OurTypes.ResHandler) {
        guard let url = URL(string: envData.url) else {
            print("Invalid URL")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        setRequestSettings(on: &request)
        
        let task = session.dataTask(with: request, completionHandler: dataHandler)
        task.resume()
    }

}
