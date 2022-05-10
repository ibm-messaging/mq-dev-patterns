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
using Newtonsoft.Json;
using IBM.XMS;


namespace ibmmq_samples
{
    class SimpleResponse
    {
        private Env env = new Env();

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
            sessionWMQ = connectionWMQ.CreateSession(true, AcknowledgeMode.SessionTransacted);
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
                {
                    Console.WriteLine("Wait timed out.");
                    sessionWMQ.Rollback();
                }
            }

            // Cleanup
            consumer.Close();
            destination.Dispose();
            sessionWMQ.Dispose();
            connectionWMQ.Close();
        }

        void replyToMessage(ITextMessage textMessage, ISession sessionWMQ)
        {
            try
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
                    sessionWMQ.Commit();
                    Console.WriteLine("Message sent");
                }
            }
            catch (XMSException ex)
            {
                Console.WriteLine("**********XMS Exception**********");
                Console.WriteLine("XMS Exception caught: ", ex);
                sessionWMQ.Rollback();
            }
            catch (Exception ex)
            {
                Console.WriteLine("**********Exception**********");
                Console.WriteLine("Exception caught: ", ex);
                sessionWMQ.Rollback();
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
    }
}
