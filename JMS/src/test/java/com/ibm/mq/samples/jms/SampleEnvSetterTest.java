/*
* (c) Copyright IBM Corporation 2024
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

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class SampleEnvSetterTest {

    static SampleEnvSetter envSetter;
    @BeforeAll
    public static void setUp(){
        envSetter = new SampleEnvSetter();

        //Mock endpoints
        JSONObject endpoint1 = new JSONObject();
        endpoint1.put("HOST", "127.0.0.1");
        endpoint1.put("PORT", "1415");
        endpoint1.put("CHANNEL", "DEV.APP.SVRCONN");
        endpoint1.put("QMGR", "QM1");
        endpoint1.put("APP_USER", "app");
        endpoint1.put("APP_PASSWORD", "passw0rd");
        endpoint1.put("QUEUE_NAME", "DEV.QUEUE.1");
        endpoint1.put("BACKOUT_QUEUE", "DEV.QUEUE.2");
        endpoint1.put("MODEL_QUEUE_NAME", "DEV.APP.MODEL.QUEUE");
        endpoint1.put("DYNAMIC_QUEUE_PREFIX", "APP.REPLIES.*");
        endpoint1.put("TOPIC_NAME", "dev/");
        endpoint1.put("BINDINGS", false);
        endpoint1.put("REQUEST_MESSAGE_EXPIRY", 1000);

        JSONObject endpoint2 = new JSONObject();
        endpoint2.put("HOST", "127.0.0.2");
        endpoint2.put("PORT", "1414");
        endpoint2.put("CHANNEL", "");
        endpoint2.put("QMGR", "*QMGroupA");
        // endpoint2.put("APP_USER", "app");
        endpoint2.put("APP_PASSWORD", "passw0rd");
        endpoint2.put("QUEUE_NAME", "DEV.QUEUE.1");
        endpoint2.put("BACKOUT_QUEUE", "DEV.QUEUE.2");
        endpoint2.put("MODEL_QUEUE_NAME", "DEV.APP.MODEL.QUEUE");
        endpoint2.put("DYNAMIC_QUEUE_PREFIX", "APP.REPLIES.*");
        endpoint2.put("TOPIC_NAME", "dev/");
        endpoint2.put("BINDINGS", true);
        JSONArray mockEndPoints = new JSONArray();
        mockEndPoints.put(endpoint1);
        mockEndPoints.put(endpoint2);
        
        envSetter.setMqEndpoints(mockEndPoints);
    }

    @Test
    public void testGetEnvValueWithoutEnv() {

        // Test with existing key and Index
        String value = envSetter.getEnvValue("HOST", 0);
        assertEquals("127.0.0.1", value);

        // Test with Non-Existing key
        value = envSetter.getEnvValue("NON_EXISTING_KEY", 0);
        assertNull(value);

        // Test with existing key but Index out of bound
        value = envSetter.getEnvValue("HOST", 2);
        assertNull(value);
    }

    @Test
    public void testGetEnvValueWithEnv() {
        System.setProperty("APP_USER", "app");

        // Test for non-existing key but existing Environment variable
        String value = envSetter.getEnvValue("APP_USER", 1);
        assertEquals("app", value);
    }

    @Test
    public void testGetEnvValueOrDefault() {

        // Test for existing key and index with random default value
        String value = envSetter.getEnvValueOrDefault("QMGR", "QM3", 0);
        assertEquals("QM1", value);

        // Test for non-existing key with default value
        value = envSetter.getEnvValueOrDefault("APP_USER", "app", 1);
        assertEquals("app", value);

        // Test for existing key with empty value
        value = envSetter.getEnvValueOrDefault("CHANNEL", "DEV.APP.SVRCONN", 1);
        assertEquals("DEV.APP.SVRCONN", value);

    }

    @Test 
    public void testGetPortEnvValue(){
        //Test for correct port key
        int value = envSetter.getPortEnvValue("PORT", 0);
        assertEquals(1415 , value);

        //Test for default port given invalid port key
        value = envSetter.getPortEnvValue("INVALID_PORT", 0);
        assertEquals(1414 , value);
        // //Test for default port
        // value = envSetter.getPortEnvValue("PORT", 1);
        // assertEquals(1414 , value);
    }

    @Test 
    public void testGetEnvBooleanValue(){
        //Test with existing Key with true value
        Boolean value = envSetter.getEnvBooleanValue("BINDINGS", 1);
        assertTrue(value);

        //Test with existing Key with false value
        value = envSetter.getEnvBooleanValue("BINDINGS", 0);
        assertFalse(value);

        //Test with non-boolean key
        value = envSetter.getEnvBooleanValue("APP_USER", 1);
        assertFalse(value);
        //Test with Index out of bound
        value = envSetter.getEnvBooleanValue("BINDINGS", 2);
        assertFalse(value);
    }

    @Test
    public void testGEBVWithEnv(){
        System.setProperty("BINDINGS", "true");
        //Test for Non existing but existing env key
        Boolean value = envSetter.getEnvBooleanValue("BINDINGS", 0);
        assertTrue(value);
    }

    @Test 
    public void testGetEnvLongValue(){
        //Test for Existing long key
        Long value = envSetter.getEnvLongValue("REQUEST_MESSAGE_EXPIRY", 0);
        assertEquals(Long.valueOf(1000), value);
        //Test for key that is not long type
        value = envSetter.getEnvLongValue("APP_USER", 0);
        assertEquals(Long.valueOf(0), value);
    }

    @Test 
    public void testGetCheckCCDT(){
        //MQCCDTURL is not set
        String value = envSetter.getCheckForCCDT();
        //Test for getCheckForCCDT when MQCCDTURL is not set
        assertNull(value);

        //MQCCDTURL is set
        System.setProperty("MQCCDTURL", "file://../ccdt.json");
        value = envSetter.getCheckForCCDT();
        //Test for getCheckForCCDT with MQCCDTURL set to correct ccdt file location
        assertEquals("file://../ccdt.json", value);
        System.setProperty("MQCCDTURL", "file://ccdt.json");
        value = envSetter.getCheckForCCDT();
        //Test for getCheckForCCDT with MQCCDTURL set to incorrect ccdt file location
        assertNull(value);
    }

    @Test 
    public void testGetConnectionString(){
        List<String> coll = new ArrayList<String>();
        coll.add("127.0.0.1(1415)");
        coll.add("127.0.0.2(1414)");
        //Mock connection string
        String connString = String.join(",", coll);
        String value = envSetter.getConnectionString();
        assertEquals(connString, value);
    }
}
