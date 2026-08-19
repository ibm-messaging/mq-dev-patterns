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

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

import com.ibm.mq.constants.MQConstants;

public class SampleEnvSetter {

    private JSONArray endpoints;
    private List<MQDetails> details;
    private List<Hashtable<String, Object>> props;

    public SampleEnvSetter() {
        this.details = new ArrayList<>();
        this.props = new ArrayList<>();
    }

    public void setEnvValues() {

        loadEnv("env.json");

        for (int i = 0; i < endpoints.length(); i++) {
            System.out.println("Processing endpoint " + i);
            JSONObject point = endpoints.getJSONObject(i);
            MQDetails details = new MQDetails();
            this.details.add(details.buildMQDetails(point));
            this.props.add(getEnvValues(details));
        }

        System.out.println("Sample MQ GET application ending");

    }

    private void loadEnv(String path) {
        try {
            String content = new String(Files.readAllBytes(Paths.get(path)));
            JSONObject env = new JSONObject(content);
            this.endpoints = env.getJSONArray("MQ_ENDPOINTS");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private Hashtable<String, Object> getEnvValues(MQDetails details) {

        System.out.println(details);

        Hashtable<String, Object> props = new Hashtable<>();
        String ccdtUrl = System.getenv("MQCCDTURL");

        if (ccdtUrl != null && ccdtUrl.startsWith("file://")) {
            String ccdtPath = ccdtUrl.replace("file://", "");
            System.setProperty("MQCCDTURL", ccdtPath);
            System.out.println("Using CCDT at: " + ccdtPath);
        } else {
            props.put(MQConstants.HOST_NAME_PROPERTY, details.getHOST());
            props.put(MQConstants.PORT_PROPERTY, Integer.parseInt(details.getPORT()));
            props.put(MQConstants.CHANNEL_PROPERTY, details.getCHANNEL());
        }

        props.put(MQConstants.USER_ID_PROPERTY, details.getUSER());
        props.put(MQConstants.PASSWORD_PROPERTY, details.getPASSWORD());
        props.put(MQConstants.TRANSPORT_PROPERTY, MQConstants.TRANSPORT_MQSERIES_CLIENT);

        if (!details.getKEY_REPOSITORY().isEmpty()) {
            props.put(MQConstants.SSL_CIPHER_SUITE_PROPERTY, details.getCIPHER());
            System.setProperty("com.ibm.mq.ssl.keyStore", details.getKEY_REPOSITORY());
            System.setProperty("com.ibm.mq.ssl.keyStorePassword", "");
        }
        return props;
    }

    public List<MQDetails> getDetails() {
        return details;
    }

    public List<Hashtable<String, Object>> getProps() {
        return props;
    }

    @Override
    public String toString() {
        return "SampleEnvSetter [details=" + details.size() + ", props=" + props.size() + "]";
    }

}