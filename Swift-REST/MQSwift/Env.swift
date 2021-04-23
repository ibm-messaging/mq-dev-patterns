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


// Structures to allow us to read and decipher envrionment json file

struct EndPoint : Codable {
    var host : String
    var port : String
    var csrfToken : String
    var qmgr : String
    var queueName : String
    var appUser : String
    var appPassword : String
    
    enum CodingKeys: String, CodingKey {
        case host = "HOST"
        case port = "PORT"
        case csrfToken = "CSRFTOKEN"
        case qmgr = "QMGR"
        case queueName = "QUEUE_NAME"
        case appUser = "APP_USER"
        case appPassword = "APP_PASSWORD"
    }
    
    // Function that allows us to override json file settings with envrionment settings
    mutating func checkForEnvironmentOverrides() {
        let envDict = ProcessInfo.processInfo.environment
        if let v = envDict["HOST"] {
            host = v
        }
        if let v = envDict["PORT"] {
            port = v
        }
        if let v = envDict["CSRFTOKEN"] {
            csrfToken = v
        }
        if let v = envDict["QMGR"] {
            qmgr = v
        }
        if let v = envDict["QUEUE_NAME"] {
            queueName = v
        }
        if let v = envDict["APP_USER"] {
            appUser = v
        }
        if let v = envDict["APP_PASSWORD"] {
            appPassword = v
        }
    }
}

struct Env : Codable {
    var mqEndpoints : [EndPoint]
    
    enum CodingKeys: String, CodingKey {
        case mqEndpoints = "MQ_ENDPOINTS"
    }
}
