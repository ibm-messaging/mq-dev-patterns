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
import org.json.JSONArray;
import org.json.JSONException;
import java.io.IOException;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.lang.System;
import java.util.ArrayList;
import java.util.List;

public class SampleEnvSetter {

    private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");
    private JSONArray mqEndPoints;

    private static final String CCDT = "MQCCDTURL";
    private static final String FILEPREFIX = "file://";
    private static final String ZOS = "z/os";

    public SampleEnvSetter() {
        JSONObject mqEnvSettings = null;
        mqEndPoints = null;  
        File file = getEnvFile();

        try {
            String content = new String(Files.readAllBytes(Paths.get(file.toURI())));
            mqEnvSettings = new JSONObject(content);

            logger.info("File read");

            if (mqEnvSettings != null) {
              logger.info("JSON Data Found");
              mqEndPoints = (JSONArray) mqEnvSettings.getJSONArray("MQ_ENDPOINTS");
            }

            if (mqEndPoints == null || mqEndPoints.isEmpty()) {
                logger.warning("No Endpoints found in .json file next instruction " +
                                 "will raise a null pointer exception");
            } else {
                logger.info("There is at least one MQ endpoint in the .json file");
            }
        } catch (IOException e) {
            logger.warning("Error processing env.json file");
            logger.warning(e.getMessage());
        } catch (JSONException e) {
          logger.warning("Error parsing env.json file");
          logger.warning(e.getMessage());         
        }
    }

    private File getEnvFile() {
        File file = null;
        boolean onZ = System.getProperty("os.name").toLowerCase().contains(ZOS);
        if (onZ) {
            logger.info("Running on z/OS");
            file = new File("../env-zbindings.json");
            if (! file.exists()){
                logger.info("Environment settings env-zbindings.json file not found");
                file = null;
            }   
        }
        if (null == file) {
            file = new File("../env.json");
            if (! file.exists()){
                logger.info("Environment settings env.json file not found");
                logger.info("If there are no envrionment overrides then the app will not be able to connect to MQ");
                file = null;
            }  
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
          logger.warning("Error looking for json key " + key);
          logger.warning(e.getMessage());         
        }

        if (! key.contains("PASSWORD")) {
          logger.info("returning " + value + " for key " + key);
        }
        return value;
    }

    public Boolean getEnvBooleanValue(String key, int index) {
      JSONObject mqAppEnv = null;

      Boolean value = Boolean.getBoolean(key);

      try {
          if (!value && mqEndPoints != null &&
                          ! mqEndPoints.isEmpty()) {
              mqAppEnv = (JSONObject) mqEndPoints.get(index);
              value = (Boolean) mqAppEnv.getBoolean(key);
              if (value == null) {
                value = false;
              }
          }
      } catch (JSONException e) {
        logger.warning("Error looking for json key " + key);
        logger.warning(e.getMessage());         
      }

      logger.info("returning " + value + " for key " + key);

      return value;
    }    

    public Long getEnvLongValue(String key, int index) {
        JSONObject mqAppEnv = null;
        Long value = Long.getLong(key,0L);

        try {
            if (value <= 0L && mqEndPoints != null &&
                            ! mqEndPoints.isEmpty()) {
                mqAppEnv = (JSONObject) mqEndPoints.get(index);
                value = (Long) mqAppEnv.getLong(key);
                if (value == null) {
                  value = 0L;
                }
            }
        } catch (JSONException e) {
          logger.warning("Error looking for json key " + key);
          logger.warning(e.getMessage());         
        }
  
        logger.info("returning " + value + " for key " + key);

        return value;
    }

    public String getCheckForCCDT() {
        String value = System.getProperty(CCDT);

        if (value != null && ! value.isEmpty()) {
            String ccdtFile = value;
            if (ccdtFile.startsWith(FILEPREFIX)) {
                ccdtFile = ccdtFile.split(FILEPREFIX)[1];
                logger.info("Checking for existance of file " + ccdtFile);

                File tmp = new File(ccdtFile);
                if (! tmp.exists()) {
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
        logger.info("Connection string will be " + connString);

        return connString;
    }

    public int getCount() {
        return mqEndPoints.length();
    }
}
