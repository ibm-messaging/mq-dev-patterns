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

import java.util.logging.*;

public class TestLogHandler extends Handler{
    private StringBuilder logs = new StringBuilder();

    @Override
    public void publish(LogRecord record){
        logs.append(record.getMessage()).append("\n");
    }

    @Override
    public void flush(){
        logs.setLength(0);
    }

    @Override
    public void close(){
        flush();
    }

    public String getLogs(){
        return logs.toString();
    }
}
