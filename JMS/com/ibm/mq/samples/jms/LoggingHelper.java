/*
* (c) Copyright IBM Corporation 2019, 2025
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

public class LoggingHelper {
    private static boolean isLoggingInitialized = false;
    private static final Level LOGLEVEL = Level.ALL;

    public static void init(Logger logger) {
        if (isLoggingInitialized)
            return;

        logger.setUseParentHandlers(false); // avoid duplicate logs

        for (Handler handler : logger.getHandlers()) {
            if (handler instanceof ConsoleHandler) {
                logger.removeHandler(handler);
            }
        }

        ConsoleHandler consoleHandler = new ConsoleHandler();
        consoleHandler.setLevel(LOGLEVEL);
        logger.addHandler(consoleHandler);

        logger.setLevel(LOGLEVEL);
        logger.finest("Logging initialized");

        isLoggingInitialized = true;
    }
}