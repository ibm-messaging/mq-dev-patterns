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

package com.ibm.mq.samples.jms.quarkus;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import java.util.logging.*;

import javax.inject.Inject;
import javax.jms.ConnectionFactory;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;

import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.StartupEvent;

import com.ibm.mq.samples.jms.qpid.Constants;
import com.ibm.mq.samples.jms.qpid.Options;
import com.ibm.mq.samples.jms.qpid.BrowseJMS20;
import com.ibm.mq.samples.jms.qpid.GetJMS20;
import com.ibm.mq.samples.jms.qpid.PutJMS20;

/**
 * A bean consuming prices from the JMS queue.
 */
@ApplicationScoped
public class AMQPTester implements Runnable {

  @Inject
  ConnectionFactory connectionFactory;

  @Inject
  AMQPTestConfig appConfig;

  private static final Level LOGLEVEL = Level.ALL;
  private static final Logger logger = Logger.getLogger("com.ibm.mq.samples.jms.quarkus");

  private final ExecutorService scheduler = Executors.newSingleThreadExecutor();

  void onStart(@Observes StartupEvent ev) {
    scheduler.submit(this);
  }

  void onStop(@Observes ShutdownEvent ev) {
    scheduler.shutdown();
  }

  @Override
  public void run() {

    logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    logger.info("Running AMQP Test Thread");

    Options options = OptionsBuilder.determineOptions(appConfig, logger);

    Boolean done = false;
    while (!done) {
      try {
        runSample(options);
        logger.info("AMQP test completed, pausing before restart");
        if ( Constants.MODE_PUT.equals(options.mode()) ) {
          pause(2 * Constants.MINUTE);
        } else {
          pause(10 * Constants.SECOND);
        }
        logger.info("Rerunning AMQP test");
      } catch (Exception e) {
        done = true;
        logger.warning("Exception caught, terminating appliction loop");
        logger.warning(e.getMessage());
      }
    }

    logger.info("Exiting AMQP Test Thread");
    logger.info("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
  }

   private void pause(long t) {
     logger.info("Pausing...");
     try {
         Thread.sleep(t);
     } catch(InterruptedException ex) {}
   }

  private void runSample(Options options) {
    logger.info("Running sample " + options.mode());
    switch(options.mode()) {
      case Constants.MODE_PUT:
        new PutJMS20(options, connectionFactory)
          .prep()
          .send("Message from quarkus qpid jms 2.0 client")
          .close();
        break;

      case Constants.MODE_GET:
        new GetJMS20(options, connectionFactory)
          .prep()
          .get()
          .close();
        break;

      case Constants.MODE_BROWSE:
        new BrowseJMS20(options, connectionFactory)
          .prep()
          .browse()
          .close();
        break;
    }
  }

}
