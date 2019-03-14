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
using System.IO;
using Newtonsoft.Json;
using IBM.XMS;


namespace dotnet
{
    class SimpleResponse
    {
        ConnVariables conn = null;
        private const int TIMEOUTTIME = 30000;
        private static bool keepRunning = true;


        public static void Response()
        {
            Console.WriteLine("===> START of Simple Response sample for WMQ transport <===\n");
            Console.CancelKeyPress += delegate (object sender, ConsoleCancelEventArgs e)
            {
                e.Cancel = true;
                SimpleResponse.keepRunning = false;
            };
            try
            {
                SimpleResponse simpleConsumer = new SimpleResponse();
                if (simpleConsumer.EnvironmentIsSet())
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
            Console.WriteLine("===> END of Simple Response sample for WMQ transport <===\n\n");
        }

        void ReceiveMessages()
        {
            XMSFactoryFactory factoryFactory;
            IConnectionFactory cf;
            IConnection connectionWMQ;
            ISession sessionWMQ;
            IDestination destination;
            IMessageConsumer consumer;
            ITextMessage textMessage;

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
            //            cf.SetIntProperty(XMSC.WMQ_CONNECTION_MODE, XMSC.WMQ_CM_CLIENT);
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
            destination = sessionWMQ.CreateQueue(conn.queue_name);
            Console.WriteLine("Destination created");

            // Create consumer
            consumer = sessionWMQ.CreateConsumer(destination);
            Console.WriteLine("Consumer created");

            // Start the connection to receive messages.
            connectionWMQ.Start();
            Console.WriteLine("Connection started");

            Console.WriteLine("Receive message: " + TIMEOUTTIME / 1000 + " seconds wait time");
            // Wait for 30 seconds for messages. Exit if no message by then
            while (SimpleResponse.keepRunning)
            {
                textMessage = (ITextMessage)consumer.Receive(TIMEOUTTIME);
                if (textMessage != null)
                {
                    Console.WriteLine("Message received.");
                    Console.Write(textMessage);
                    Console.WriteLine("\n");
                    replyToMessage(textMessage, sessionWMQ);
                }
                else
                    Console.WriteLine("Wait timed out.");
            }



            // Cleanup
            consumer.Close();
            destination.Dispose();
            sessionWMQ.Dispose();
            connectionWMQ.Close();
        }

        void replyToMessage(ITextMessage textMessage, ISession sessionWMQ)
        {
            IDestination replyDestination = textMessage.JMSReplyTo;
            if (replyDestination != null)
            {
                ITextMessage replyMessage = sessionWMQ.CreateTextMessage();
                IMessageProducer producer = sessionWMQ.CreateProducer(replyDestination);
                replyMessage.JMSCorrelationID = textMessage.JMSCorrelationID;

                MessageValue v = JsonConvert.DeserializeObject<MessageValue>(textMessage.Text);
                Console.WriteLine(v.value);
                v.message = "The squared number is: ";
                v.value *= v.value;
                replyMessage.Text = v.toJsonString();
                producer.SetIntProperty(XMSC.DELIVERY_MODE, XMSC.DELIVERY_NOT_PERSISTENT);
                producer.Send(replyMessage);
                Console.WriteLine("Message sent");
            }
        }

        bool EnvironmentIsSet()
        {
            try
            {
                Console.WriteLine("Looking for file");
                using (StreamReader r = new StreamReader("env.json"))
                {
                    Console.WriteLine("File found");
                    string json = r.ReadToEnd();
                    conn = JsonConvert.DeserializeObject<ConnVariables>(json);
                    conn.dump();
                    Console.WriteLine("");

                }
                return true;
            }
            catch (Exception e)
            {
                Console.WriteLine("Exception caught: {0}", e);
                Console.WriteLine(e.GetBaseException());
                return false;
            }

        }

        public class JsonMessage
        {
            public string msg;
            public int random;
            public JsonMessage(string s, int n)
            {
                msg = s;
                random = n;
            }
            public string toJsonString()
            {
                return JsonConvert.SerializeObject(this);
            }
        }

        public class MessageValue
        {
            public string message;
            public int value;
            public string toJsonString()
            {
                return JsonConvert.SerializeObject(this);
            }
        }

        public class ConnVariables
        {
            public string host;
            public string qmgr;
            public int port;
            public string channel;
            public string queue_name;
            public string app_user;
            public string app_password;
            public string cipher_suite;
            public string key_repository;
            public void dump()
            {
                Console.WriteLine("hostname{0} ", host);
                Console.WriteLine("port{0} ", port);
                Console.WriteLine("qmgr{0} ", qmgr);
                Console.WriteLine("channel{0} ", channel);
                Console.WriteLine("queue{0} ", queue_name);
                Console.WriteLine("app_user{0} ", app_user);
                //Console.WriteLine("app_password{0} ", app_password);
                Console.WriteLine("cipherSpec{0} ", cipher_suite);
                Console.WriteLine("sslKeyRepository{0} ", key_repository);
            }
        }
    }
}
