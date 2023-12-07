/****************************************************************************************/
/*                                                                                      */
/*                                                                                      */
/*  Copyright 2023 IBM Corp.                                                            */
/*                                                                                      */
/*  Licensed under the Apache License, Version 2.0 (the "License");                     */
/*  you may not use this file except in compliance with the License.                    */
/*  You may obtain a copy of the License at                                             */
/*                                                                                      */
/*  http://www.apache.org/licenses/LICENSE-2.0                                          */
/*                                                                                      */
/*  Unless required by applicable law or agreed to in writing, software                 */
/*  distributed under the License is distributed on an "AS IS" BASIS,                   */
/*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.            */
/*  See the License for the specific language governing permissions and                 */
/*  limitations under the License.                                                      */
/*                                                                                      */
/*                                                                                      */
/****************************************************************************************/
/*                                                                                      */
/*  FILE NAME:      SimplePub.cs                                                        */
/*                                                                                      */
/*  DESCRIPTION:    A .NET applicaton used to publish messages to broker-IBM MQ.        */
/*  AMQP 1.0 in use. amqpnetlite.core library is used.                                  */
/*  Refer : https://github.com/Azure/amqpnetlite                                        */
/*                                                                                      */
/****************************************************************************************/


namespace ibmmq_amqp_samples
{
    class SimplePub
    {
        private Env env = new Env();
        private String hostName = null;
        private String topicName = null;
        private int port = 0;
        private String Username = null;
        private String Password = null;

        public static void Pub()
        {
            Console.WriteLine("Start of SimplePub Application\n");

            SimplePub simplePub = new SimplePub();
            if (simplePub.env.EnvironmentIsSet())
            {
                simplePub.hostName = simplePub.env.Conn.host;
                simplePub.port = simplePub.env.Conn.port;
                simplePub.Username = simplePub.env.Conn.app_user;
                simplePub.Password = simplePub.env.Conn.app_password;
                simplePub.topicName = simplePub.env.Conn.topic_name;

                simplePub.PutMessages();
            }

            Console.WriteLine("\nEnd of SimplePub Application\n");
        }

        void PutMessages()
        {
            string add = "amqp://" + Username + ":" + Password + "@" + hostName + ":" + port;
            Address address = new Address(add);

            // Create Connection
            Connection connection = new Connection(address);

            // Create Session
            Session session = new Session(connection);

            // Create Target and specify the endpoint as TOPIC
            Target target = new Target();
            target.Address = topicName;
            target.Capabilities = new Symbol[]{
                new Symbol("topic")
            };

            void OnAttached(ILink link, Attach attach)
            {
                // Handle the attachment event
                if (attach != null && target.Address != null)
                    Console.WriteLine("Sender link attached successfully!");
                else
                    Console.WriteLine("Sender link attachment failed!");
            }

            // Create SenderLink
            SenderLink sender = new SenderLink(session, "client", target, OnAttached);

            // Create Message Object pointing to endpoint
            Message message = new Message("Hello AMQP!");
            message.Properties = new Properties();
            message.Properties.To = add;

            // publish the message to specific topic
            sender.Send(message);
            Console.WriteLine("message sent < " + message.Body.ToString() + " >.. ");
            Console.WriteLine("Pub Successfull");

            // close the connection
            sender.Close();
            session.Close();
            connection.Close();
        }
    }
}