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
import java.io.FileReader;
import java.io.IOException;
import java.io.FileNotFoundException;
import java.lang.System;

public class SampleEnvSetter {

    private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");
    private JSONObject mqAppEnv;

    public SampleEnvSetter() {
        mqAppEnv = null;
        try {
            JSONParser parser = new JSONParser();
            Object data = parser.parse(new FileReader("../env.json"));
            logger.info("File read");
            mqAppEnv = (JSONObject) data;
            String qm = (String) mqAppEnv.get("QMGR");
            logger.info(qm);

        } catch (FileNotFoundException e) {
            logger.warning(e.getMessage());
        } catch (IOException e) {
            logger.warning(e.getMessage());
        } catch (ParseException e) {
            logger.warning(e.getMessage());
        }
    }

    public String getEnvValue(String key) {
        String value = System.getenv(key);
        if ((value == null || value.isEmpty()) && mqAppEnv != null) {
            value = (String) mqAppEnv.get(key);
        }
        if (! key.contains("PASSWORD")) {
          logger.info("returning " + value + " for key " + key);
        }
        return value;
    }
}