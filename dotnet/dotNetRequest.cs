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
using System.Collections.Generic;
using System.Text;
using Newtonsoft.Json;
using IBM.XMS;


namespace ibmmq_samples
{
    class SimpleRequest
    {
        ConnVariables conn = null;

        private const int TIMEOUTTIME = 30000;
        private const String simpleMessage = "This is a request message from XMS.NET";
        private JsonMessage xmsJson = new JsonMessage("This is a simple put and your lucky number is ");

        public static void Request()
        {
            Console.WriteLine("===> START of Simple Producer sample for WMQ transport <===\n");
            try
            {
                SimpleRequest request = new SimpleRequest();
                if (request.EnvironmentIsSet())
                {
                    request.SendMessage();
                }
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
            Console.WriteLine("===> END of Simple Producer sample for WMQ transport <===\n\n");
        }

        void SendMessage()
        {
            XMSFactoryFactory factoryFactory;
            IConnectionFactory cf;
            IConnection connectionWMQ;
            ISession sessionWMQ;
            IDestination destination;
            IDestination temporaryDestination;
            IMessageProducer producer;
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
            cf.SetStringProperty(XMSC.WMQ_QUEUE_MANAGER, conn.qmgr);
            cf.SetStringProperty(XMSC.USERID, conn.app_user);
            cf.SetStringProperty(XMSC.PASSWORD, conn.app_password);
            cf.SetStringProperty(XMSC.WMQ_TEMPORARY_MODEL, conn.model_queue_name);
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
            destination.SetIntProperty(XMSC.WMQ_TARGET_CLIENT, XMSC.WMQ_TARGET_DEST_MQ);
            Console.WriteLine("Destination created");

            // Create producer
            producer = sessionWMQ.CreateProducer(destination);
            Console.WriteLine("Producer created");

            // Start the connection to receive messages.
            connectionWMQ.Start();
            Console.WriteLine("Connection started");

            // Create a text message and send it.
            textMessage = sessionWMQ.CreateTextMessage();

            String corrID = xmsJson.correlationID;

            textMessage.Text = xmsJson.toJsonString();
            //***disable for correl id by using message id
            textMessage.JMSCorrelationID = corrID;
            textMessage.JMSExpiration = 900000;
            temporaryDestination = sessionWMQ.CreateTemporaryQueue();
            textMessage.JMSReplyTo = temporaryDestination;

            producer.Send(textMessage);
            Console.WriteLine("Message sent");
            Console.WriteLine(textMessage.JMSCorrelationID);
            Console.WriteLine(corrID);
            String str = textMessage.JMSMessageID;
            String selector = "JMSCorrelationID='ID:" + JsonMessage.getCorrFilter(corrID) + "'";


            Console.WriteLine(selector);

            IMessageConsumer consumer = sessionWMQ.CreateConsumer(temporaryDestination, selector);
            ITextMessage responseMessage = (ITextMessage)consumer.Receive(TIMEOUTTIME);
            if (responseMessage != null)
            {
                Console.WriteLine("Message received.");
                Console.Write(responseMessage);
                Console.WriteLine("\n");
            }
            else
                Console.WriteLine("Wait timed out.");


            // Cleanup
            producer.Close();
            destination.Dispose();
            sessionWMQ.Dispose();
            connectionWMQ.Close();
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
            public int value;
            public string correlationID;
            private static Random random = new Random();
            private const int CO_ID_LENGTH = 24;
            public JsonMessage(string s)
            {
                msg = s;
                value = random.Next();
                correlationID = correlIdGenerator();
            }
            public string toJsonString()
            {
                return JsonConvert.SerializeObject(this);
            }
            private static String correlIdGenerator()
            {
                //JMS/XMS is forcing this to generate a 24byte hext string so we need to
                //generate an ASCII string 1 char per byte of length 24 char and converting that into a hex string
                return Guid.NewGuid().ToString().PadRight(CO_ID_LENGTH);
            }

            public static byte[] ToByteArray(String HexString)
            {
                int NumberChars = HexString.Length;
                byte[] bytes = new byte[NumberChars / 2];
                for (int i = 0; i < NumberChars; i += 2)
                {
                    bytes[i / 2] = Convert.ToByte(HexString.Substring(i, 2), 16);
                }
                return bytes;
            }

            public static String getCorrFilter(String s)
            {
                return JsonMessage.AsHexString(JsonMessage.AsBytes(s)).Replace("-", "").Substring(0, 2 * CO_ID_LENGTH);
            }

            private static String AsHexString(byte[] ba)
            {
                return BitConverter.ToString(ba);
            }

            private static byte[] AsBytes(String s)
            {
                return Encoding.Default.GetBytes(s);
            }
        }

        public class ConnVariables
        {
            public string host = null;
            public string qmgr = null;
            public int port = 0;
            public string channel = null;
            public string queue_name = null;
            public string app_user = null;
            public string app_password = null;
            public string model_queue_name = null;
            public string cipher_suite = null;
            public string key_repository = null;
            public void dump()
            {
                Console.WriteLine("hostname{0} ", host);
                Console.WriteLine("port{0} ", port);
                Console.WriteLine("qmgr{0} ", qmgr);
                Console.WriteLine("channel{0} ", channel);
                Console.WriteLine("queue{0} ", queue_name);
                Console.WriteLine("app_user{0} ", app_user);
                //Console.WriteLine("app_password{0} ", app_password);
                Console.WriteLine("model_queue_name{0}", model_queue_name);
                Console.WriteLine("cipherSpec{0} ", cipher_suite);
                Console.WriteLine("sslKeyRepository{0} ", key_repository);
            }
        }
    }
}
