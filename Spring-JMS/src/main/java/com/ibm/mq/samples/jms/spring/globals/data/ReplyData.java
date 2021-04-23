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

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReplyData {
    protected final Log logger = LogFactory.getLog(getClass());

    private String greeting;
    private int result[];

    public void logResult() {
        if (null != result) {
            logger.info("Factors in reply are:");
            for (int i : result) {
                logger.info(i);
            }
        } else {
            logger.warn("No factors found in reply");
        }
    }

    public void  calcResponse(int value) {
        // Should send some meaningful data, but for now.
        result = new int[] {1,2,3};
    }

}
