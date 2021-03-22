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


package com.ibm.mq.samples.jms.spring.globals.data;

import java.util.function.Supplier;

public class DataSource implements Supplier<OurData> {
    static private int currPosition = 0;
    static private String greetings[] = {"Hello", "Hi", "Good day", "Welcome"};

    @Override
    public OurData get() {
        if (currPosition >= greetings.length) {
            currPosition = 0;
        }
        OurData nxtData = new OurData(greetings[currPosition]);
        currPosition++;
        return nxtData;
    }
}


