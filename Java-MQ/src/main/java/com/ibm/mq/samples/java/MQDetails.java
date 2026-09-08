/*
* (c) Copyright IBM Corporation 2025
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
package com.ibm.mq.samples.java;

import org.json.JSONObject;

public class MQDetails {

    private String QMGR;
    private String QUEUE_NAME;
    private String HOST;
    private String PORT;
    private String CHANNEL;
    private String USER;
    private String PASSWORD;
    private String KEY_REPOSITORY;
    private String CIPHER;
    private String MODEL_QUEUE_NAME;
    private String DYNAMIC_QUEUE_PREFIX;

    public MQDetails buildMQDetails(JSONObject endpoint) {
        this.QMGR = endpoint.getString("QMGR");
        this.QUEUE_NAME = endpoint.getString("QUEUE_NAME");
        this.HOST = endpoint.getString("HOST");
        this.PORT = String.valueOf(endpoint.getInt("PORT"));
        this.CHANNEL = endpoint.getString("CHANNEL");
        this.USER = endpoint.getString("APP_USER");
        this.PASSWORD = endpoint.getString("APP_PASSWORD");
        this.KEY_REPOSITORY = endpoint.optString("KEY_REPOSITORY", "");
        this.CIPHER = endpoint.optString("CIPHER", "");
        this.MODEL_QUEUE_NAME = endpoint.optString("MODEL_QUEUE_NAME", "");
        this.DYNAMIC_QUEUE_PREFIX = endpoint.optString("DYNAMIC_QUEUE_PREFIX", "");

        return this;
    }

    public String getQMGR() {
        return QMGR;
    }

    public String getQUEUE_NAME() {
        return QUEUE_NAME;
    }

    public String getHOST() {
        return HOST;
    }

    public String getPORT() {
        return PORT;
    }

    public String getCHANNEL() {
        return CHANNEL;
    }

    public String getUSER() {
        return USER;
    }

    public String getPASSWORD() {
        return PASSWORD;
    }

    public String getKEY_REPOSITORY() {
        return KEY_REPOSITORY;
    }

    public String getCIPHER() {
        return CIPHER;
    }

    public String getMODEL_QUEUE_NAME() {
        return MODEL_QUEUE_NAME;
    }

    public String getDYNAMIC_QUEUE_PREFIX() {
        return DYNAMIC_QUEUE_PREFIX;
    }

    @Override
    public String toString() {
        return "MQDetails [QMGR=" + QMGR + ", QUEUE_NAME=" + QUEUE_NAME + ", HOST=" + HOST + ", PORT=" + PORT
                + ", CHANNEL=" + CHANNEL + ", USER=" + USER + ", PASSWORD=" + PASSWORD + ", KEY_REPOSITORY="
                + KEY_REPOSITORY + ", CIPHER=" + CIPHER + ", MODEL_QUEUE_NAME=" + MODEL_QUEUE_NAME
                + ", DYNAMIC_QUEUE_PREFIX=" + DYNAMIC_QUEUE_PREFIX + "]";
    }
}