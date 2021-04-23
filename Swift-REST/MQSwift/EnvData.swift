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

// Class to hold execution mode and requisite environment settings.
class EnvData {
    enum Mode {
        case put
        case get
    }
    
    var env:Env?
    var mode:Mode?
    
    static let defaultEnvPath = "./envrest.json"
    
    static let defaultModeSetting = "PUT"
}

// Properties determined by environment settings
extension EnvData {
    var url:String {
        var mqURL = "https://"
        if let env = env {
            mqURL += env.mqEndpoints[0].host
            mqURL += ":"
            mqURL += env.mqEndpoints[0].port
            mqURL += "/ibmmq/rest/v1/messaging/qmgr/"
            mqURL += env.mqEndpoints[0].qmgr
            mqURL += "/queue/"
            mqURL += env.mqEndpoints[0].queueName
            mqURL += "/message"
        }
        print("Constructed URL is \(mqURL)")
        return mqURL
    }
    
    var csrfToken:String {
        var token = ""
        if let env = env {
            token = (env.mqEndpoints[0].csrfToken)
        }
        return token
    }
    
    var authString:String {
        var auth = ""
        if let env = env {
            let username = env.mqEndpoints[0].appUser
            let password = env.mqEndpoints[0].appPassword
            let loginString = String(format: "%@:%@", username, password)
            let loginData = loginString.data(using: String.Encoding.utf8)!
            let base64LoginString = loginData.base64EncodedString()
            auth = "Basic \(base64LoginString)"
        }
        return auth
    }
}

// Methods to load up execution mode and requisite environment settings.
extension EnvData {
    private func setMode(_ modeSetting:String) {
        switch modeSetting {
        case "PUT":
            mode = .put
        case "GET":
            mode = .get
        default:
            print("Unrecognized mode")
        }
    }
    
    func loadEnv() -> Bool {
        print("Checking command line arguments")
        let args = CommandLine.arguments
            
        let modeSetting = args.count > 1 ? args[1].uppercased(): EnvData.defaultModeSetting
        setMode(modeSetting)
        
        guard (nil != mode) else {
            print("Unable to run mode \(modeSetting)")
            return false
        }
        
        let envPath = args.count > 2 ? args[2] : EnvData.defaultEnvPath
        
        print("Loading envrionment settings from \(envPath)")
        
        do {
            let data = try Data(contentsOf: URL(fileURLWithPath: envPath), options: .mappedIfSafe)
            print("Envrionment data loaded")
            
            env = try JSONDecoder().decode(Env.self, from: data)
            
            guard (env != nil) else {
                print("Envrionment has not been set")
                return false
            }
            
            env?.mqEndpoints[0].checkForEnvironmentOverrides()
            
            print("Envrionment settings are \(env!)")
            return true
            
        } catch {
            print(error)
        }
        return false
    }
    
    func isValid() -> Bool {
        guard(env != nil) else {
            print("Envrionment not set")
            return false
        }
        
        let e = env!
        
        guard (e.mqEndpoints.count > 0) else {
            print("No entries found in envrionment json file")
            return false
        }

        print(e.mqEndpoints)
        let host = e.mqEndpoints[0].host
        let port = e.mqEndpoints[0].port
        print("Will be connecting to MQ at \(host)(\(port))")

        return true
    }
}
