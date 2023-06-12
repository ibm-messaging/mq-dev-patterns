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
import java.util.UUID;
import org.json.JSONObject;
import org.json.JSONException;

public class RequestResponseHelper {

    private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");
    private static final String MODE_DEFAULT = "DEFAULT";
    private static final String MODE_REWARDS = "REWARDS";

    private static final String MODE_KEY = "requestmode";

    private static final String KEY_AWARD = "award";
    private static final String KEY_CREDIT = "credit";
    private static final String KEY_CUSTOMER_ID = "customerID";
    private static final String KEY_MESSAGE = "message";
    private static final String KEY_VALUE = "value";

    public static String buildStringForRequest(String mode, long r) {
        JSONObject obj = new JSONObject();

        switch (validModeOrDefault(mode)) {
            case MODE_DEFAULT:
                buiildDefaultRequest(obj, r);
                break;
            case MODE_REWARDS:
                buiildRewardsRequest(obj, r);
                break;
        }

        String reply = obj.toString();
        return reply;
    }

    public static String buildStringForResponse(String request) {
        JSONObject objResponse = new JSONObject();
        JSONObject objRequest = objFromRequestString(request);

        switch (validModeOrDefault(modeFromRequest(objRequest))) {
            case MODE_DEFAULT:
                buiildDefaultResponse(objResponse, objRequest);
                break;
            case MODE_REWARDS:
                buiildRewardsResponse(objResponse, objRequest);
                break;
        }      

        String reply = objResponse.toString();
        return reply;
    }

    private static long requestIntegerSquared(JSONObject obj) {
        long n = getLongFromObj(obj, KEY_VALUE);
        n *= n;
        return n;
    }

    private static JSONObject objFromRequestString(String request) {
        try {
            JSONObject obj = new JSONObject(request);
            return obj;
        } catch (JSONException e) {
            logger.warning("Error parsing string for JSON object");
            return null;
        }        
    }

    private static String modeFromRequest(JSONObject request) {
        return validModeOrDefault(getStringFromObj(request, MODE_KEY));
    }

    private static String validModeOrDefault(String mode) {
        if (null == mode || mode.trim().isEmpty()) {
            return MODE_DEFAULT;
        }
        switch (mode) {
            case MODE_DEFAULT:
            case MODE_REWARDS:
                return mode;
        }
        return MODE_DEFAULT;
    }

    private static void buiildDefaultRequest(JSONObject obj, long r) {
        obj.put(MODE_KEY, MODE_DEFAULT);
        obj.put(KEY_MESSAGE, "The number is:");
        obj.put(KEY_VALUE, Long.valueOf(r));
    }

    private static void buiildDefaultResponse(JSONObject obj, JSONObject objRequest) {
        obj.put(KEY_MESSAGE, "The number is:");
        obj.put(KEY_VALUE, Long.valueOf(requestIntegerSquared(objRequest)));
    }

    private static void buiildRewardsRequest(JSONObject obj, long r) {
        obj.put(MODE_KEY, MODE_REWARDS);
        obj.put(KEY_CUSTOMER_ID, UUID.randomUUID().toString());
        obj.put(KEY_AWARD, Long.valueOf(r));
    }

    private static void buiildRewardsResponse(JSONObject obj, JSONObject objRequest) {
        obj.put(KEY_MESSAGE, "Awards successfully deposited in customer account");
        obj.put(KEY_CUSTOMER_ID, getStringFromObj(objRequest, KEY_CUSTOMER_ID));
        obj.put(KEY_CREDIT, getLongFromObj(objRequest, KEY_AWARD));
    }

    private static String getStringFromObj(JSONObject obj, String key) {
        try {
            return obj.getString(key);
        } catch (JSONException e) {
            logger.warning("Error looking for key " + key + " in json request");
            logger.warning(e.getMessage());  
            return "";       
        }
    }

    private static Long getLongFromObj(JSONObject obj, String key) {
        try {
            return obj.getLong(key);
        } catch (JSONException e) {
            logger.warning("Error looking for key " + key + " in json request");
            logger.warning(e.getMessage());  
            return 0L;       
        }
    }
}
