/*
* (c) Copyright IBM Corporation 2019, 2023
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
*/

package com.ibm.mq.samples.jms;

import java.util.logging.*;
import org.json.JSONObject;
import org.json.JSONException;

public class RequestCalc {

    private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");

    public static String buildStringForRequest(long r) {
        JSONObject obj = new JSONObject();
        obj.put("message", "The number is:");
        obj.put("value", Long.valueOf(r));
        String reply = obj.toString();
        return reply;
    }

    public static long requestIntegerSquared(String response) {
        long n = 0;

        try {
            JSONObject obj = new JSONObject(response);
            n = (long) obj.getLong("value");
            n *= n;
        } catch (JSONException e) {
            logger.warning("Error looking for value in json request");
            logger.warning(e.getMessage());         
        }
        return n;
    }

}
