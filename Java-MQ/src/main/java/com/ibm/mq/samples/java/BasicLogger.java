/*
 * (c) Copyright IBM Corporation 2026
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

package com.ibm.mq.samples.java;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.logging.ConsoleHandler;
import java.util.logging.Formatter;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import java.util.logging.Logger;

import com.ibm.mq.MQException;

/*
 * This class is used to define and configure a logger with code, rather than external configurations
 * such as a log4j properties file. It is intended for this standalone set of applications, not for
 * integration within other frameworks. So we can make assumptions about the root logger, and set its
 * formatting.
 */
public class BasicLogger extends Logger {

  private static final String LOGLEVEL = "LOGLEVEL";
  private static final Level DEFAULT_LOG_LEVEL = Level.ALL;

  private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss")
      .withZone(ZoneId.systemDefault());

  private BasicLogger() {
    // Not to be called
    super(null,null);
  }

  BasicLogger(Class<?> c) {
    super(c.getName(), null);

    Level logLevel;

    // Allow the log level to be set by environment variable or property.
    // If neither, use a default level.
    String logLevelString = System.getenv(LOGLEVEL);
    if (logLevelString == null) {
      logLevelString = System.getProperty(LOGLEVEL);
    }

    if (logLevelString != null) {
      logLevel = Level.parse(logLevelString);
    } else {
      logLevel = DEFAULT_LOG_LEVEL;
    }

    setLevel(logLevel);

    // Find the parent logger and set the formatter for it.
    // If there is no parent (we are the root) then the config is applied directly.
    Logger parent = this;
    while (parent.getParent() != null) {
      parent = parent.getParent();
    }

    Handler[] handlers = parent.getHandlers();
    if (handlers == null || handlers.length == 0) {
      // Make sure we've got at least one handler
      Handler h = new ConsoleHandler();
      parent.addHandler(h);
      handlers = parent.getHandlers();
    }
    for (Handler h : handlers) {
      h.setLevel(logLevel);
      h.setFormatter(formatter);
    }
  }

  // This overrides the default log formatting, which splits things onto two lines and is more verbose
  // than we really need. But it does show how you could modify the formatting for your own purposes too.
  private static final Formatter formatter = new Formatter() {
    @Override
    public String format(LogRecord record) {
      String time = TIME_FORMATTER.format(record.getInstant());

      String source = record.getSourceClassName();
      if (source == null) {
        source = record.getLoggerName();
      }

      // Do not need to report the package name, just the basic class
      String simpleClassName = "";
      if (source != null) {
        int lastDot = source.lastIndexOf('.');
        simpleClassName = (lastDot >= 0) ? source.substring(lastDot + 1) : source;
      }

      // Format the message text, with its inserts. This work with with "{0} {1}"-style log messages
      // The default formatting of numbers in log records will give us "1,414" instead of "1414". We'll
      // override that by doing our own formatting first.
      Object[] parms = record.getParameters();
      if (parms != null) {
        for (int i=0;i<parms.length;i++) {
          if (parms[i] instanceof Number) {
            parms[i] = parms[i].toString();
          }
        }
        record.setParameters(parms);
      }

      String message = formatMessage(record);

      // And if there's an exception, format that too
      String throwable = "";
      if (record.getThrown() != null) {
        java.io.StringWriter sw = new java.io.StringWriter();
        java.io.PrintWriter pw = new java.io.PrintWriter(sw);
        pw.println();
        record.getThrown().printStackTrace(pw);
        pw.close();
        throwable = sw.toString();
      }

      return String.format("[%s] [%-7s] %-20s: %s%s%n",
          time,
          record.getLevel().getLocalizedName(),
          simpleClassName,
          message,
          throwable);
    }
  };

  void logError(String msg) {
    log(Level.SEVERE, msg);
    Globals.setFailed();
  }

  void logException(String msg, MQException mqe) {
    log(Level.SEVERE, "{0} Reason code: {1} {2}",new Object[] {msg, mqe.getReason(), mqe.getMessage()});
    mqe.printStackTrace(System.err);

    Globals.setFailed();
  }

  void logException(Exception e) {
    if (e instanceof MQException) {
      MQException mqe = (MQException)e;
      String s = String.format("MQ Exception. Reason code: %d %s",mqe.getReason(), mqe.getMessage());
      severe(s);
    } else {
      log(Level.SEVERE, "Unexpected error: {0}", e.getMessage());
    }
    e.printStackTrace(System.err);
    Globals.setFailed();
  }
}