/*
 * (c) Copyright IBM Corporation 2019, 2026
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

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/*
 * This class reads a JSON configuration file containing information about how to connect to
 * one or more queue managers. It also contains other information used by the programs such as
 * the queue to use when putting/getting messages.
 */

public class EnvSetter {

  private static final Logger logger = LoggingHelper.getLogger(EnvSetter.class.getName());
  private JSONArray mqEndPoints;
  private JSONObject jwtEndPoints;
  private static final String CCDT = "MQCCDTURL";
  private static final String FILEPREFIX = "file://";
  private static final String ZOS = "z/OS";
  private static final int DEFAULT_MQI_PORT = 1414;

  public static final String ENV_FILE = "EnvFile"; // Environment variable or property
  public static final String DEFAULT_ENV_FILE = "../env.json";
  public static final String DEFAULT_Z_ENV_FILE ="../env-zbindings.json";

  public EnvSetter() {
    JSONObject mqEnvSettings = null;

    mqEndPoints = null;
    File file = getEnvFile();

    if (null == file) {
      logger.warning("No configuration settings file found");
      return;
    }

    try {
      String content = new String(Files.readAllBytes(Paths.get(file.toURI())));
      mqEnvSettings = new JSONObject(content);

      logger.info("File read");

      if (mqEnvSettings != null) {
        logger.info("JSON Data Found");
        mqEndPoints = mqEnvSettings.getJSONArray("MQ_ENDPOINTS");
      }

      if (mqEnvSettings != null && mqEnvSettings.has("JWT_ISSUER")) {
        jwtEndPoints = mqEnvSettings.getJSONObject("JWT_ISSUER");
      }

      if (mqEndPoints == null || mqEndPoints.isEmpty()) {
        logger.warning("No endpoints found in the configuration file");
      } else {
        logger.info("There is at least one MQ endpoint in the configuration file");
      }

      if (jwtEndPoints != null) {
        logger.info("JWT endpoints found. Will use JWT to Authenticate");
      }

    } catch (IOException | JSONException e) {
      logger.log(Level.WARNING, "Error processing configuration file: {0}",e.getMessage());
    }
  }

  private File getEnvFile() {
    File file = null;
    boolean onZ = System.getProperty("os.name").toLowerCase().contains(ZOS);

    // Allow environment variable or system property to override env file location and name
    String valueEnvFile = null;

    if (System.getenv(ENV_FILE) != null) {
      valueEnvFile = System.getenv(ENV_FILE);
    }
    if (valueEnvFile == null) {
      valueEnvFile = System.getProperty(ENV_FILE);
    }

    if (valueEnvFile == null) {
      if (onZ) {
        logger.info("Running on z/OS");
        valueEnvFile = DEFAULT_Z_ENV_FILE;
      } else {
        valueEnvFile = DEFAULT_ENV_FILE;
      }
    }

    logger.log(Level.INFO, "Looking for configuration file {0}", valueEnvFile);

    file = new File(valueEnvFile);
    if (! file.exists()){
      logger.log(Level.WARNING, "Configuration settings file {0} not found",valueEnvFile);
      file = null;
    }
    return file;
  }

  public String getEnvValue(String key, int index) {
    JSONObject mqAppEnv = null;
    String value = System.getProperty(key);

    try {
      if ((value == null || value.isEmpty()) &&
          mqEndPoints != null &&
          ! mqEndPoints.isEmpty()) {
        mqAppEnv = (JSONObject) mqEndPoints.get(index);
        value = (String) mqAppEnv.get(key);
      }
    } catch (JSONException e) {
      logger.log(Level.WARNING, "Error looking for json key {0}: {1}", new Object[] {key,e.getMessage()});
    }

    if (!key.contains("PASSWORD")) {
      logger.log(Level.FINE, "Returning key {0}: {1}", new Object[] { key, value});
    } else {
      logger.log(Level.FINE, "Returning value for key {0}", new Object[] { key});
    }
    return value;
  }

  public String getEnvValueOrDefault(String key, String defaultValue, int index) {
    String value = getEnvValue(key, index);

    return (null == value || value.trim().isEmpty())
        ? defaultValue
            : value;
  }

  public int getPortEnvValue(String key, int index) {
    int value = DEFAULT_MQI_PORT;
    try {
      value = Integer.parseInt(this.getEnvValue(key, index));
    } catch (NumberFormatException e) {
      logger.log(Level.WARNING, "Unable to parse port value: {0}",e.getMessage());
      logger.log(Level.WARNING, "Setting port to default value: {0}", DEFAULT_MQI_PORT);
    }
    return value;
  }

  public Boolean getEnvBooleanValue(String key, int index) {
    JSONObject mqAppEnv = null;

    // Is there a system property?
    Boolean value = Boolean.getBoolean(key);

    try {
      // if it's not already known to be TRUE, then look in the config file
      // if it's still not there, return FALSE
      if (!value && mqEndPoints != null &&
          ! mqEndPoints.isEmpty()) {
        mqAppEnv = (JSONObject) mqEndPoints.get(index);
        value = mqAppEnv.optBoolean(key,false);
      }
    } catch (JSONException e) {
      logger.log(Level.WARNING, "Error looking for json key {0}: {1}", new Object[] {key,e.getMessage()});
    }
    logger.log(Level.FINE, "Returning key {0}: {1}", new Object[] { key, value});

    return value;
  }

  public Long getEnvLongValue(String key, int index) {
    JSONObject mqAppEnv = null;
    Long value = Long.getLong(key,0L);

    try {
      if (value <= 0L && mqEndPoints != null &&
          ! mqEndPoints.isEmpty()) {
        mqAppEnv = (JSONObject) mqEndPoints.get(index);
        value = mqAppEnv.optLong(key,0L);
      }
    } catch (JSONException e) {
      logger.log(Level.WARNING, "Error looking for json key {0}: {1}", new Object[] {key,e.getMessage()});
    }
    logger.log(Level.FINE, "Returning key {0}: {1}", new Object[] { key, value});

    return value;
  }

  public String getCheckForCCDT() {
    String value = System.getProperty(CCDT);

    if (value != null && ! value.isEmpty()) {
      String ccdtFile = value;
      if (ccdtFile.startsWith(FILEPREFIX)) {
        ccdtFile = ccdtFile.split(FILEPREFIX)[1];
        logger.log(Level.INFO, "Checking for existance of file {0}", ccdtFile);

        File tmp = new File(ccdtFile);
        if (! tmp.exists()) {
          logger.info("CCDT file not found");
          value = null;
        }
      }
    }
    return value;
  }

  public String getConnectionString() {
    List<String> coll = new ArrayList<String>();

    for (Object o : mqEndPoints) {
      JSONObject jo = (JSONObject) o;
      String s = (String) jo.get("HOST") + "(" + (String) jo.get("PORT") + ")";
      coll.add(s);
    }

    String connString = String.join(",", coll);
    logger.log(Level.INFO, "Connection string: {0}", connString);

    return connString;
  }

  public int getCount() {
    // If there are no endpoints, then values
    // need to come from a CCDT and environment settings
    return (null == mqEndPoints) ? 1 : mqEndPoints.length();
  }

  // Return the section of the configuration file that has JWT configuration
  public String getJwtEnv(String key) {
    String value = System.getProperty(key);
    try {
      if ((value == null || value.isEmpty()) &&
          jwtEndPoints != null &&
          !jwtEndPoints.isEmpty()) {
        value = jwtEndPoints.getString(key);
      }
    } catch (JSONException e) {
      logger.log(Level.WARNING, "Error looking for json key {0}: {1}", new Object[] {key,e.getMessage()});
    }

    if (! key.contains("JWT_TOKEN_PWD")) {
      logger.log(Level.FINE, "Returning key {0}: {1}", new Object[] { key, value});
    }
    return value;
  }
}
