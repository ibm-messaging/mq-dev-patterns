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

// Delegate class, needed to handle the situation when self-signed
// certificates are in use on the MQ Server.
public class HTTPRequestDelegate: NSObject, URLSessionDelegate
{
    // Get Challenged twice, 2nd time challenge.protectionSpace.serverTrust is nil, but works!
    public func urlSession(_ session: URLSession,
                    didReceive challenge: URLAuthenticationChallenge,
                    completionHandler: (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        print("In invalid certificate completion handler")
        if challenge.protectionSpace.serverTrust != nil {
            completionHandler(.useCredential, URLCredential(trust: challenge.protectionSpace.serverTrust!))
        } else {
            completionHandler(.useCredential, nil)
        }
    }
}
