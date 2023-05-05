/*
* (c) Copyright IBM Corporation 2019
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
import org.json.simple.parser.ParseException;
import org.json.simple.parser.JSONParser;
import org.json.simple.JSONObject;
import java.lang.System;

public class RequestCalc {

    private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");

    public static String buildStringForRequest(long r) {

        JSONObject obj = new JSONObject();
        obj.put("message", "The number is:");
        obj.put("value", new Long(r));
        String reply = obj.toString();
        return reply;

    }

    public static long requestIntegerSquared(String response) {
        long n = 0;
        try {

            JSONParser parser = new JSONParser();
            Object data = parser.parse(response);
            logger.info("Value retrieved from request");
            JSONObject obj = (JSONObject) data;
            if (null != obj.get("value")) {
              n = (long) obj.get("value");
            }
            n *= n;

        } catch (ParseException e) {
            logger.warning(e.getMessage());
        }
        return n;
    }

}
