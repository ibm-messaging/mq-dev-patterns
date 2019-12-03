/*
* (c) Copyright IBM Corporation 2018
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

using System;
using IBM.XMS;


namespace ibmmq_samples
{
    class SimpleConsumer
    {
        private Env env = new Env();
        private const int TIMEOUTTIME = 30000;
        private static bool keepRunning = true;

        public static void Get()
        {
            Console.WriteLine("===> START of Simple Consumer sample for WMQ transport <===\n");
            Console.CancelKeyPress += delegate (object sender, ConsoleCancelEventArgs e)
            {
                e.Cancel = true;
                SimpleConsumer.keepRunning = false;
            };
            try
            {
                SimpleConsumer simpleConsumer = new SimpleConsumer();
                if (simpleConsumer.env.EnvironmentIsSet())
                    simpleConsumer.ReceiveMessages();
            }
            catch (XMSException ex)
            {
                Console.WriteLine("XMSException caught: {0}", ex);
                if (ex.LinkedException != null)
                {
                    Console.WriteLine("Stack Trace:\n {0}", ex.LinkedException.StackTrace);
                }
                Console.WriteLine("Sample execution  FAILED!");
            }
            catch (Exception ex)
            {
                Console.WriteLine("Exception caught: {0}", ex);
                Console.WriteLine("Sample execution  FAILED!");
            }
            Console.WriteLine("===> END of Simple Consumer sample for WMQ transport <===\n\n");
        }

        private void ReceiveMessages()
        {
            XMSFactoryFactory factoryFactory;
            IConnectionFactory cf;

            // Get an instance of factory.
            factoryFactory = XMSFactoryFactory.GetInstance(XMSC.CT_WMQ);

            // Create WMQ Connection Factory.
            cf = factoryFactory.CreateConnectionFactory();

            foreach (Env.ConnVariables e in env.GetEndpoints())
            {
                Console.WriteLine("Consuming messages from endpoint {0}({1})", e.host, e.port);

                // Set the properties
                ConnectionPropertyBuilder.SetConnectionProperties(cf, e);

                try
                {
                    ReceiveMessagesFromEndpoint(cf);
                }
                catch (XMSException ex)
                {
                    Console.WriteLine("XMSException caught: {0}", ex);
                    Console.WriteLine("Error Code: {0}", ex.ErrorCode);
                    Console.WriteLine("Error Message: {0}", ex.Message);

                    if (ex.LinkedException != null &&
                           IBM.XMS.MQC.MQRC_Q_MGR_NOT_AVAILABLE.ToString().Equals(ex.LinkedException.Message))
                    {
                        Console.WriteLine("Queue Manager on this endpoint not available");
                        Console.WriteLine("Moving onto next endpoint");
                        continue;
                    }
                    Console.WriteLine("Unexpected Error - Aborting");
                    throw;
                }
            }
        }

        private void ReceiveMessagesFromEndpoint(IConnectionFactory cf)
        {
            IConnection connectionWMQ;
            ISession sessionWMQ;
            IDestination destination;
            IMessageConsumer consumer;
            ITextMessage textMessage;

            // Create connection.
            connectionWMQ = cf.CreateConnection();
            Console.WriteLine("Connection created");

            // Create session
            sessionWMQ = connectionWMQ.CreateSession(false, AcknowledgeMode.AutoAcknowledge);
            Console.WriteLine("Session created");

            // Create destination
            destination = sessionWMQ.CreateQueue(env.Conn.queue_name);
            Console.WriteLine("Destination created");

            // Create consumer
            consumer = sessionWMQ.CreateConsumer(destination);
            Console.WriteLine("Consumer created");

            // Start the connection to receive messages.
            connectionWMQ.Start();
            Console.WriteLine("Connection started");

            Console.WriteLine("Receive message: " + TIMEOUTTIME / 1000 + " seconds wait time");
            // Wait for 30 seconds for messages. Exit if no message by then
            while (SimpleConsumer.keepRunning)
            {
                textMessage = (ITextMessage)consumer.Receive(TIMEOUTTIME);
                if (textMessage != null)
                {
                    Console.WriteLine("Message received.");
                    Console.Write(textMessage);
                    Console.WriteLine("\n");
                }
                else
                {
                    Console.WriteLine("Wait timed out.");
                    SimpleConsumer.keepRunning = false;
                }

            }

            // Cleanup
            consumer.Close();
            destination.Dispose();
            sessionWMQ.Dispose();
            connectionWMQ.Close();
        }
    }
 }
