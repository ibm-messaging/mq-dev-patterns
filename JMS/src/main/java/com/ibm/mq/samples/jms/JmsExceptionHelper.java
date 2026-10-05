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

import java.util.logging.Level;
import java.util.logging.Logger;

import jakarta.jms.JMSException;
import jakarta.jms.JMSRuntimeException;

/*
 * A helper class to report JMS exceptions in a common way
 */
public class JmsExceptionHelper {
  private static int exitCode = 0;

  public static int getExitCode() {
    return exitCode;
  }

  static void recordFailure(Logger logger, Exception ex) {
    if (ex != null) {
      if (ex instanceof JMSException ||  ex instanceof JMSRuntimeException) {
        processJMSException(logger, ex);
      }
      else {
        logger.log(Level.SEVERE,ex.getMessage());
      }
    }
    System.out.println("FAILURE.");
    exitCode = 1;
    return;
  }

  private static void processJMSException(Logger logger, Exception jmsex) {
    Throwable innerException = null;

    logger.log(Level.SEVERE, "Exception is: {0}", jmsex.getMessage());
    if (jmsex instanceof JMSException) {
      innerException = ((JMSException)jmsex).getLinkedException();
    } else if (jmsex instanceof JMSRuntimeException) {
      innerException = jmsex.getCause();
    }

    String errStack = "";
    while (innerException != null) {
      errStack += "\nCaused by: " + innerException.getMessage();
      innerException = innerException.getCause();
    }
    if (!errStack.isEmpty()) {
      logger.log(Level.SEVERE, errStack);
    }

    return;
  }

}
