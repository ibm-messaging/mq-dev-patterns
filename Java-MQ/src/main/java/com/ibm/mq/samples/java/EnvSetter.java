/*
 * (c) Copyright IBM Corporation 2026
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
import java.util.logging.Level;

import org.json.JSONArray;
import org.json.JSONObject;

import com.ibm.mq.constants.MQConstants;

public class EnvSetter {
  private static final BasicLogger logger = new BasicLogger(EnvSetter.class);

  public static final String ENV_FILE = "EnvFile"; // Environment variable or property
  public static final String DEFAULT_ENV_FILE = "../env.json"; // Use the same file as other samples

  private JSONArray endpoints;
  private List<MQDetails> details;
  private List<Hashtable<String, Object>> props;

  public EnvSetter() {
    this.details = new ArrayList<>();
    this.props = new ArrayList<>();
  }

  public void setEnvValues() {

    // Allow environment variable or system property to override env file location and name
    String valueEnvFile = null;

    if (System.getenv(ENV_FILE) != null) {
      valueEnvFile = System.getenv(ENV_FILE);
    }
    if (valueEnvFile == null) {
      valueEnvFile = System.getProperty(ENV_FILE);
    }

    if (valueEnvFile == null) {
      valueEnvFile = DEFAULT_ENV_FILE;
    }

    loadEnv(valueEnvFile);

    for (int i = 0; i < endpoints.length(); i++) {
      // logger.log(Level.INFO, "Processing endpoint {0}", i);
      JSONObject point = endpoints.getJSONObject(i);
      MQDetails mqdetails = MQDetails.from(point);
      this.details.add(mqdetails);
      this.props.add(getEnvValues(mqdetails));
    }
  }

  private void loadEnv(String path) {
    try {
      String content = new String(Files.readAllBytes(Paths.get(path)));
      JSONObject env = new JSONObject(content);
      this.endpoints = env.getJSONArray("MQ_ENDPOINTS");
    } catch (Exception e) {
      throw new IllegalStateException("Failed to load MQ environment file: " + path, e);
    }
  }

  private Hashtable<String, Object> getEnvValues(MQDetails _details) {

    logger.log(Level.INFO, _details.toString());

    Hashtable<String, Object> _props = new Hashtable<>();
    String ccdtUrl = System.getenv("MQCCDTURL");

    if (ccdtUrl != null && ccdtUrl.startsWith("file://")) {
      String ccdtPath = ccdtUrl.substring("file://".length());
      System.setProperty("MQCCDTURL", ccdtPath);
      logger.log(Level.INFO,"Using CCDT at: {0}", ccdtPath);
    } else {
      _props.put(MQConstants.HOST_NAME_PROPERTY, _details.getHOST());
      _props.put(MQConstants.PORT_PROPERTY, _details.getPORT());
      _props.put(MQConstants.CHANNEL_PROPERTY, _details.getCHANNEL());
    }

    _props.put(MQConstants.USER_ID_PROPERTY, _details.getUSER());
    _props.put(MQConstants.PASSWORD_PROPERTY, _details.getPASSWORD());
    _props.put(MQConstants.TRANSPORT_PROPERTY, MQConstants.TRANSPORT_MQSERIES_CLIENT);

    if (!_details.getKEY_REPOSITORY().isEmpty()) {
      _props.put(MQConstants.SSL_CIPHER_SUITE_PROPERTY, _details.getCIPHER());
      System.setProperty("com.ibm.mq.ssl.keyStore", _details.getKEY_REPOSITORY());
      System.setProperty("com.ibm.mq.ssl.keyStorePassword", "");
    }
    return _props;
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