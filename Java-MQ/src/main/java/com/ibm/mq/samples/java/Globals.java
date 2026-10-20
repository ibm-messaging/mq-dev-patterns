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

// Any global constants or variables needed in the different apps
public class Globals {

  public static final int OK = 0;
  public static final int FAILED = 1;

  private static int exitCode = OK;

  public static int getExitCode() {
    return exitCode;
  }

  public static void setFailed() {
    exitCode = FAILED;
  }

}
