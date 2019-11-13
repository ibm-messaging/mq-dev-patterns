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
    class SimpleSubscriber
    {
        private Env env = new Env();

        private const int TIMEOUTTIME = 30000;

        private static bool keepRunning = true;

        public static void Sub()
        {
            Console.WriteLine("===> START of Simple Subscriber sample for WMQ transport <===\n");
            Console.CancelKeyPress += delegate (object sender, ConsoleCancelEventArgs e)
            {
                e.Cancel = true;
                SimpleSubscriber.keepRunning = false;
            };
            try
            {
                SimpleSubscriber simpleSubscriber = new SimpleSubscriber();
                if (simpleSubscriber.env.EnvironmentIsSet())
                    simpleSubscriber.ReceiveMessages();
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
            Console.WriteLine("===> END of Simple Subscriber sample for WMQ transport <===\n\n");
        }

        void ReceiveMessages()
        {
            XMSFactoryFactory factoryFactory;
            IConnectionFactory cf;
            IConnection connectionWMQ;
            ISession sessionWMQ;
            IDestination destination;
            IMessageConsumer subscriber;
            ITextMessage textMessage;

            Env.ConnVariables conn = env.Conn;

            // Get an instance of factory.
            factoryFactory = XMSFactoryFactory.GetInstance(XMSC.CT_WMQ);

            // Create WMQ Connection Factory.
            cf = factoryFactory.CreateConnectionFactory();

            // Set the properties
            cf.SetStringProperty(XMSC.WMQ_HOST_NAME, conn.host);
            Console.WriteLine("hostName is set {0, -20 }", conn.host);
            cf.SetIntProperty(XMSC.WMQ_PORT, conn.port);
            cf.SetStringProperty(XMSC.WMQ_CHANNEL, conn.channel);
            if (conn.key_repository != null && (conn.key_repository.Contains("*SYSTEM") || conn.key_repository.Contains("*USER")))
            {
                cf.SetIntProperty(XMSC.WMQ_CONNECTION_MODE, XMSC.WMQ_CM_CLIENT);
            }
            else
            {
                cf.SetIntProperty(XMSC.WMQ_CONNECTION_MODE, XMSC.WMQ_CM_CLIENT_UNMANAGED);
            }

            cf.SetStringProperty(XMSC.WMQ_QUEUE_MANAGER, conn.qmgr);
            cf.SetStringProperty(XMSC.USERID, conn.app_user);
            cf.SetStringProperty(XMSC.PASSWORD, conn.app_password);

            if (conn.key_repository != null && conn.cipher_suite != null)
            {
                cf.SetStringProperty(XMSC.WMQ_SSL_KEY_REPOSITORY, conn.key_repository);
            }
            if (conn.cipher_suite != null)
            {
                cf.SetStringProperty(XMSC.WMQ_SSL_CIPHER_SPEC, conn.cipher_suite);
            }

            // Create connection.
            connectionWMQ = cf.CreateConnection();
            Console.WriteLine("Connection created");

            // Create session
            sessionWMQ = connectionWMQ.CreateSession(false, AcknowledgeMode.AutoAcknowledge);
            Console.WriteLine("Session created");

            // Create destination
            destination = sessionWMQ.CreateTopic(conn.topic_name);
            Console.WriteLine("Destination created");

            // Create subscriber
            subscriber = sessionWMQ.CreateConsumer(destination);
            Console.WriteLine("Subscriber created");

            // Start the connection to receive messages.
            connectionWMQ.Start();
            Console.WriteLine("Connection started");

            Console.WriteLine("Receive message: " + TIMEOUTTIME / 1000 + " seconds wait time");
            // Wait for 30 seconds for messages. Exit if no message by then
            while (SimpleSubscriber.keepRunning)
            {
                textMessage = (ITextMessage)subscriber.Receive(TIMEOUTTIME);
                if (textMessage != null)
                {
                    Console.WriteLine("Message received.");
                    Console.Write(textMessage);
                    Console.WriteLine("\n");
                }
                else
                    Console.WriteLine("Wait timed out.");
            }
            // Cleanup
            subscriber.Close();
            destination.Dispose();
            sessionWMQ.Dispose();
            connectionWMQ.Close();
        }
    }
}
