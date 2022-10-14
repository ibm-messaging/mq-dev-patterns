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


namespace ibmmq_samples
{
    class SimplePublisher
    {
        private Env env = new Env();
        private JsonMessage xmsJson = new JsonMessage("This is a simple publisher and your lucky number is ");

        public static void Pub()
        {
            Console.WriteLine("===> START of Simple Producer sample for WMQ transport <===\n");
            try
            {
                SimplePublisher simpleProducer = new SimplePublisher();
                if (simpleProducer.env.EnvironmentIsSet())
                    simpleProducer.SendMessage();
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
            Console.WriteLine("===> END of Simple Publisher sample for WMQ transport <===\n\n");
        }

        void SendMessage()
        {
            XMSFactoryFactory factoryFactory;
            IConnectionFactory cf;
            IConnection connectionWMQ;
            ISession sessionWMQ;
            IDestination destination;
            IMessageProducer producer;
            ITextMessage textMessage;

            Env.ConnVariables conn = env.Conn;

            // Get an instance of factory.
            factoryFactory = XMSFactoryFactory.GetInstance(XMSC.CT_WMQ);

            // Create WMQ Connection Factory.
            cf = factoryFactory.CreateConnectionFactory();

            // Set the properties
            ConnectionPropertyBuilder.SetConnectionProperties(cf, env);

            // Create connection.
            connectionWMQ = cf.CreateConnection();
            Console.WriteLine("Connection created");

            // Create session
            sessionWMQ = connectionWMQ.CreateSession(false, AcknowledgeMode.AutoAcknowledge);
            Console.WriteLine("Session created");

            // Create destination
            destination = sessionWMQ.CreateTopic(conn.topic_name);
            destination.SetIntProperty(XMSC.WMQ_TARGET_CLIENT, XMSC.WMQ_TARGET_DEST_MQ);
            Console.WriteLine("Destination created");

            // Create producer
            producer = sessionWMQ.CreateProducer(destination);
            Console.WriteLine("Publisher created");

            // Start the connection to receive messages.
            connectionWMQ.Start();
            Console.WriteLine("Connection started");

            // Create a text message and send it.
            textMessage = sessionWMQ.CreateTextMessage();
            textMessage.Text = xmsJson.ToJsonString();
            producer.Send(textMessage);
            Console.WriteLine("Message published");

            // Cleanup
            producer.Close();
            destination.Dispose();
            sessionWMQ.Dispose();
            connectionWMQ.Close();
        }
    }
}