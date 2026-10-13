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

import org.json.JSONObject;

public class MQDetails {

  private final String QMGR;
  private final String QUEUE_NAME;
  private final String HOST;
  private final int PORT;
  private final String CHANNEL;
  private final String USER;
  private final String PASSWORD;
  private final String KEY_REPOSITORY;
  private final String CIPHER;
  private final String MODEL_QUEUE_NAME;
  private final String DYNAMIC_QUEUE_PREFIX;
  private final String TOPIC_NAME;
  private final String TOPIC_OBJECT;

  private MQDetails(JSONObject endpoint) {
    this.QMGR = endpoint.getString("QMGR");
    this.QUEUE_NAME = endpoint.getString("QUEUE_NAME");
    this.HOST = endpoint.getString("HOST");
    this.PORT = endpoint.getInt("PORT");
    this.CHANNEL = endpoint.getString("CHANNEL");
    this.USER = endpoint.getString("APP_USER");
    this.PASSWORD = endpoint.getString("APP_PASSWORD");
    this.KEY_REPOSITORY = endpoint.optString("KEY_REPOSITORY", "");
    this.CIPHER = endpoint.optString("CIPHER", "");
    this.MODEL_QUEUE_NAME = endpoint.optString("MODEL_QUEUE_NAME", "");
    this.DYNAMIC_QUEUE_PREFIX = endpoint.optString("DYNAMIC_QUEUE_PREFIX", "");
    this.TOPIC_NAME = endpoint.optString("TOPIC_NAME", "dev/");
    this.TOPIC_OBJECT = endpoint.optString("TOPIC_OBJECT", "DEV.BASE.TOPIC");
  }

  /** Factory method — replaces the mutating buildMQDetails() approach. */
  public static MQDetails from(JSONObject endpoint) {
    return new MQDetails(endpoint);
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

  public int getPORT() {
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

  public String getTOPIC_NAME() {
    return TOPIC_NAME;
  }

  public String getTOPIC_OBJECT() {
    return TOPIC_OBJECT;
  }

  @Override
  public String toString() {
    return "MQDetails [QMGR=" + QMGR + ", QUEUE_NAME=" + QUEUE_NAME + ", HOST=" + HOST + ", PORT=" + PORT
        + ", CHANNEL=" + CHANNEL + ", USER=" + USER + ", PASSWORD=" + PASSWORD + ", KEY_REPOSITORY="
        + KEY_REPOSITORY + ", CIPHER=" + CIPHER + ", MODEL_QUEUE_NAME=" + MODEL_QUEUE_NAME
        + ", DYNAMIC_QUEUE_PREFIX=" + DYNAMIC_QUEUE_PREFIX + ", TOPIC_NAME=" + TOPIC_NAME
        + ", TOPIC_OBJECT=" + TOPIC_OBJECT + "]";
  }
}
