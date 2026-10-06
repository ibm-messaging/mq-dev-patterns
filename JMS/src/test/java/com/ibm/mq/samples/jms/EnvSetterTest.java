/*
 * (c) Copyright IBM Corporation 2024, 2026
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

/*
 * This is a package of JUnit testcases to exercise the configuration options.
 * On its own, this is not esepcially valuable, but it demonstrates how unit tests
 * can be integrated into a Maven-based Java project.
 */
package com.ibm.mq.samples.jms;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class EnvSetterTest {

  private static EnvSetter envSetter;

  @BeforeAll
  public static void setUp(){
    System.setProperty(EnvSetter.ENV_FILE , EnvSetter.DEFAULT_ENV_FILE);
    envSetter = new EnvSetter();
  }

  @Test
  public void testGetEnvValueWithoutEnv() {
    // Test for HOST key
    String value = envSetter.getEnvValue("HOST", 0);
    assertNotNull(value);

    // Test with Non-Existing key
    value = envSetter.getEnvValue("NON_EXISTING_KEY", 0);
    assertNull(value);
  }

  @Test
  public void testGetEnvValueWithEnv() {
    System.setProperty("APP_USER", "testUser");

    // Test for non-existing key but existing Environment variable
    String value = envSetter.getEnvValue("APP_USER", 1);
    assertEquals("testUser", value);
  }

  @Test
  public void testGetEnvValueOrDefault() {
    // Test for existing key and index with random default value
    String value = envSetter.getEnvValueOrDefault("QMGR", "QM3", 0);
    assertNotNull(value);

    // Test for non-existing key with default value
    value = envSetter.getEnvValueOrDefault("NON_EXISTING_KEY", "test", 1);
    assertEquals("test", value);
  }

  @Test
  public void testGetPortEnvValue(){
    //Test for port key
    int value = envSetter.getPortEnvValue("PORT", 0);
    assertNotNull(value);

    //Test for default port given invalid port key
    value = envSetter.getPortEnvValue("INVALID_PORT", 0);
    assertEquals(1414 , value);

  }

  @Test
  public void testGEBVWithEnv(){
    System.setProperty("BINDINGS", "true");
    //Test for Non existing but existing env key
    Boolean value = envSetter.getEnvBooleanValue("BINDINGS", 0);
    assertTrue(value);
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
    int count = envSetter.getCount();
    String value = envSetter.getConnectionString();
    String[] arrStrings = value.split(",");
    assertEquals(count, arrStrings.length);
  }

  @Test
  public void testMissingEndpointValues(){
    int count = envSetter.getCount();
    //Check for each endpoint for missing essential values
    for(int idx = 0 ; idx < count ; idx++){
      String value = envSetter.getEnvValue("HOST", idx);
      assertNotNull(value);
      value = envSetter.getEnvValue("PORT", idx);
      assertNotNull(value);
      value = envSetter.getEnvValue("CHANNEL", idx);
      assertNotNull(value);
      value = envSetter.getEnvValue("QMGR", idx);
      assertNotNull(value);
      value = envSetter.getEnvValue("APP_USER", idx);
      assertNotNull(value);
      value = envSetter.getEnvValue("APP_PASSWORD", idx);
      assertNotNull(value);
      value = envSetter.getEnvValue("QUEUE_NAME", idx);
      assertNotNull(value);
      value = envSetter.getEnvValue("BACKOUT_QUEUE", idx);
      assertNotNull(value);
      value = envSetter.getEnvValue("MODEL_QUEUE_NAME", idx);
      assertNotNull(value);
      value = envSetter.getEnvValue("DYNAMIC_QUEUE_PREFIX", idx);
      assertNotNull(value);
      value = envSetter.getEnvValue("TOPIC_NAME", idx);
      assertNotNull(value);
    }
  }
}