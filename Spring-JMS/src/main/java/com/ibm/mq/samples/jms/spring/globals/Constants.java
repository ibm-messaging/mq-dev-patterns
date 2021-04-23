/*
 * (c) Copyright IBM Corporation 2021
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

package com.ibm.mq.samples.jms.spring.globals;

public class Constants {
    static public final long SECOND = 1000L;
    static public final long MINUTE = 60 * SECOND;
    static public final long HOUR = 60 * MINUTE;

    static public final String DATATYPE = "appdatatype";
    static public final String TEMPQUEUEPREFIX = "AMQ.";

    public enum DataTypes {
        OURDATATYPE(10),
        OUROTHERDATATYPE(20);

        private final int value;

        DataTypes(int setting) { this.value = setting; }
        public int getValue() { return this.value; }
    }
}
