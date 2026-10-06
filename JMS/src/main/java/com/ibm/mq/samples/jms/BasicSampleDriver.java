/*
 * (c) Copyright IBM Corporation 2020, 2026
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

/*
 * This is the main entrypoint to the jar file. It can invoke any of the 6 components to
 * put and get messages in various styles.
 *
 * Invoke it with
 *   java -cp target/mq-dev-patterns-jakarta-0.1.0.jar com.ibm.mq.samples.jms.BasicSampleDriver [operation]
 */

package com.ibm.mq.samples.jms;

import java.util.logging.Level;
import java.util.logging.Logger;

public class BasicSampleDriver {
  private static final String MODE_PUT = "put";
  private static final String MODE_GET = "get";
  private static final String MODE_PUBLISH = "pub";
  private static final String MODE_SUBSCRIBE = "sub";

  private static final String MODE_REQUEST = "req";
  private static final String MODE_RESPONSE = "rsp";

  private static final String MODE_DEFAULT = MODE_PUT;

  private static final int DEFAULT_PUT_COUNT = 2;
  private static final int TIMEOUT = 10 * 1000; // 10 seconds

  private static final Logger logger = LoggingHelper.getLogger(BasicSampleDriver.class.getName());

  private String mode = MODE_DEFAULT;
  private int numberOfMessages = DEFAULT_PUT_COUNT;

  public static void main(String[] args) {
    new BasicSampleDriver()
    .determineMode(args)
    .parseArguments(args)
    .runSample();

    System.exit(JmsExceptionHelper.getExitCode());
  }

  static void printUsage() {
    System.out.println("Usage: BasicSampleDriver [mode] [msgCount]");
    System.out.println("Mode can be one of put, get, pub, sub");
    System.out.println("                   req, rsp");
    System.out.println("The msgCount is only used in the pub/put modes");
    System.exit(1);
  }

  private BasicSampleDriver determineMode(String[] args) {
    if (args.length > 0) {
      mode = args[0].toLowerCase();
    }
    logger.log(Level.INFO, "Requested operation is \"{0}\"", mode);

    return this;
  }

  private BasicSampleDriver parseArguments(String[] args) {
    switch (mode) {
    case MODE_PUT:
    case MODE_PUBLISH:
      logger.info("Processing put/publish options");
      if (args.length > 1) {
        try {
          numberOfMessages = Integer.parseInt(args[1]);
        } catch (NumberFormatException e) {
          logger.log(Level.INFO, "Defaulting number of puts to {0}", DEFAULT_PUT_COUNT);
        }
      }
    }
    return this;
  }

  public BasicSampleDriver runSample() {
    switch(mode) {
    case MODE_PUT:
      doPutOrPublish(BasicProducer.PRODUCER_PUT);
      break;
    case MODE_GET:
      doGet();
      break;
    case MODE_PUBLISH:
      doPutOrPublish(BasicProducer.PRODUCER_PUB);
      break;
    case MODE_SUBSCRIBE:
      doSubscribe();
      break;
    case MODE_REQUEST:
      doRequest();
      break;
    case MODE_RESPONSE:
      doResponse();
      break;
    default:
      printUsage();
      break;
    }
    return this;
  }

  public void doPutOrPublish(String putorpub) {
    logger.log(Level.INFO, "Will be sending {0} messages", numberOfMessages);
    BasicProducer bp = new BasicProducer(putorpub);
    bp.send("This is a message from the sample driver", numberOfMessages);
    bp.close();
  }

  public void doGet() {
    boolean useAllEndpoints = true;

    logger.info("Will be getting messages");
    if (useAllEndpoints) {
      // This call demonstrates use of multiple endpoints
      BasicConsumerWrapper.performGet();
    } else {
      // This variant goes direct to a single consumer, from the first configured endppoint only.
      BasicConsumer bc = new BasicConsumer(BasicConsumer.CONSUMER_GET, ConnectionHelper.USE_CONNECTION_STRING);
      bc.receive(TIMEOUT);
      bc.close();
    }
  }

  public void doSubscribe() {
    logger.info("Will be subscribing to messages");
    BasicConsumer bc = new BasicConsumer(BasicConsumer.CONSUMER_SUB, ConnectionHelper.USE_CONNECTION_STRING);
    bc.receive(TIMEOUT);
    bc.close();
  }

  public void doRequest() {
    logger.info("Will be making a request and waiting for reply");
    BasicRequest.main(null);
  }

  public void doResponse() {
    logger.info("Will be waiting for requests and sending replies");
    BasicResponse.main(null);
  }
}
