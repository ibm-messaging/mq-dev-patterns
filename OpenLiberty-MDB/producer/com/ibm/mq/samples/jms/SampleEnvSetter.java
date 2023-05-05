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
import org.json.simple.JSONArray;
import java.io.FileReader;
import java.io.IOException;
import java.io.FileNotFoundException;
import java.io.File;
import java.lang.System;
import java.util.ArrayList;
import java.util.List;

public class SampleEnvSetter {

    private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");
    private JSONArray mqEndPoints;

    private static final String CCDT = "MQCCDTURL";
    private static final String FILEPREFIX = "file://";

    public SampleEnvSetter() {
        JSONObject mqEnvSettings = null;

        mqEndPoints = null;

        try {
            JSONParser parser = new JSONParser();
            Object data = parser.parse(new FileReader("./env.json"));
            logger.info("File read");

            mqEnvSettings = (JSONObject) data;

            if (mqEnvSettings != null) {
              logger.info("JSON Data Found");
              mqEndPoints = (JSONArray) mqEnvSettings.get("MQ_ENDPOINTS");
            }

            if (mqEndPoints == null || mqEndPoints.isEmpty()) {
                logger.warning("No Endpoints found in .json file next instruction " +
                                 "will raise a null pointer exception");
            } else {
                logger.info("There is at least one MQ endpoint in the .json file");
            }

        } catch (FileNotFoundException e) {
            logger.warning(e.getMessage());
        } catch (IOException e) {
            logger.warning(e.getMessage());
        } catch (ParseException e) {
            logger.warning(e.getMessage());
        }
    }

    public String getEnvValue(String key, int index) {
        JSONObject mqAppEnv = null;
        String value = System.getenv(key);

        if ((value == null || value.isEmpty()) &&
                   mqEndPoints != null &&
                   ! mqEndPoints.isEmpty()) {
            mqAppEnv = (JSONObject) mqEndPoints.get(index);
            value = (String) mqAppEnv.get(key);
        }

        if (! key.contains("PASSWORD")) {
          logger.info("returning " + value + " for key " + key);
        }
        return value;
    }


    public String[] getEnvValueArray(String key, int index) {
        JSONObject mqAppEnv = null;
        JSONArray queuesJSON;
        String QUEUES[] = {};        
        if (mqEndPoints != null && ! mqEndPoints.isEmpty()) {
            mqAppEnv = (JSONObject) mqEndPoints.get(index);
            queuesJSON = (JSONArray) mqAppEnv.get(key);
            List<String> queues = new ArrayList<String>();
            if (queuesJSON != null && ! queuesJSON.isEmpty()) {
              for (Object o : queuesJSON) {
                String q = String.valueOf(o);                
                queues.add(q);
              } 
              QUEUES = queues.toArray(new String[queues.size()]);
            } else {
              logger.warning("At least one queue has to be specified.");
            }
        }
        return QUEUES;
    }


    public String getCheckForCCDT() {
        String value = System.getenv(CCDT);

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
      return mqEndPoints.size();
    }
}
