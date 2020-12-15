/*
* (c) Copyright IBM Corporation 2020
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
import javax.jms.JMSRuntimeException;

import com.ibm.mq.constants.MQConstants;
import com.ibm.mq.MQException;


public class StatusChecker {
  private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms");

  public static boolean getCanContinue(JMSRuntimeException ex) {
    if (null != ex.getCause() && ex.getCause() instanceof MQException) {
      MQException innerException = (MQException) ex.getCause();

      if (MQConstants.MQRC_HOST_NOT_AVAILABLE == innerException.getReason()) {
        logger.info("Host not available, skipping message gets from this host");
        return true;
      }
    }

    logger.warning("Unexpected exception will be terminating process");
    ConnectionHelper.recordFailure(ex);
    return false;
  }
}
