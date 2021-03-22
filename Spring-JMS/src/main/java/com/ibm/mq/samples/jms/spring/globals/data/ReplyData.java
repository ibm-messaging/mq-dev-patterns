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
