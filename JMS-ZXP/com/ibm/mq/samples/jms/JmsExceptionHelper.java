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

import java.util.logging.Logger;

import javax.jms.JMSException;
import javax.jms.JMSRuntimeException;

/*
 * A helper class to report JMS exceptions in a common way
 */
public class JmsExceptionHelper {

  static void recordFailure(Logger logger, Exception ex) {
    if (ex != null) {
      if (ex instanceof JMSException ||  ex instanceof JMSRuntimeException) {
        processJMSException(logger, ex);
      }
      else {
        logger.warning(ex.getMessage());
      }
    }
    System.out.println("FAILURE");
    return;
  }

  private static void processJMSException(Logger logger, Exception jmsex) {
    logger.info(jmsex.getMessage());
    Throwable innerException = null;
    
    if (jmsex instanceof JMSException) {
      innerException = ((JMSException)jmsex).getLinkedException();
    } else if (jmsex instanceof JMSRuntimeException) {
      innerException = jmsex.getCause(); 
    }
    logger.warning("Exception is: " + jmsex);
    
    String errStack = "";
    while (innerException != null) {
      errStack += "\n  Caused by: " + innerException.getMessage();
      innerException = innerException.getCause();
    }
    if (!errStack.isEmpty()) {
      logger.warning(errStack);
    }
    // For more detailed information on the failure, uncomment the following line
    // jmsex.printStackTrace();
    return;
  }

}
