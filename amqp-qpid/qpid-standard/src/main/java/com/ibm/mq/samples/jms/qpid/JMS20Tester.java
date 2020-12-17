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

package com.ibm.mq.samples.jms.qpid;

import java.util.logging.*;

public class JMS20Tester {
  private static final Level LOGLEVEL = Level.ALL;
  private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms.qpid");

  private Options options = new Options(logger);

  public static void main(String[] args) throws Exception {
    new JMS20Tester()
      .parseArguments(args)
      .runSample();

    logger.info("Sample QPid JMS app is ending!");
  }

  private JMS20Tester parseArguments(String[] args) {
    options.parseArguments(args).logOptions();
    return this;
  }

  private JMS20Tester runSample() {
    switch(options.mode()) {
      case Constants.MODE_PUT:
        new PutJMS20(options)
          .prep()
          .send("Message from qpid jms 2.0 client")
          .close();
        break;

      case Constants.MODE_GET:
        new GetJMS20(options)
          .prep()
          .get()
          .close();
        break;

      case Constants.MODE_BROWSE:
        new BrowseJMS20(options)
          .prep()
          .browse()
          .close();
        break;
    }
    return this;
  }

}
