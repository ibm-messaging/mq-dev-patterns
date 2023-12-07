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
/*  FILE NAME:      SimpleGet.cs                                                        */
/*                                                                                      */
/*  DESCRIPTION:    A .NET applicaton used to get messages from broker-IBM MQ.          */
/*  AMQP 1.0 in use. amqpnetlite.core library is used.                                  */
/*  Refer : https://github.com/Azure/amqpnetlite                                        */
/*                                                                                      */
/****************************************************************************************/


namespace ibmmq_amqp_samples
{
    class SimpleGet
    {
        private Env env = new Env();
        private String hostName = null;
        private String queueName = null;
        private int port = 0;
        private String Username = null;
        private String Password = null;

        public static void Get()
        {
            Console.WriteLine("Start of SimpleGet Application\n");

            SimpleGet simpleGet = new SimpleGet();
            if (simpleGet.env.EnvironmentIsSet())
            {
                simpleGet.hostName = simpleGet.env.Conn.host;
                simpleGet.port = simpleGet.env.Conn.port;
                simpleGet.Username = simpleGet.env.Conn.app_user;
                simpleGet.Password = simpleGet.env.Conn.app_password;
                simpleGet.queueName = simpleGet.env.Conn.queue_name;

                simpleGet.GetMessages();
            }

            Console.WriteLine("\nEnd of SimpleGet Application\n");
        }

        void GetMessages()
        {
            string add = "amqp://" + Username + ":" + Password + "@" + hostName + ":" + port;
            Address address = new Address(add);

            // Create Connection
            Connection connection = new Connection(address);

            //Create Session
            Session session = new Session(connection);

            // Specify the endpoint as QUEUE
            Symbol[] s = new Symbol[]{
                new Symbol("queue")
            };
            // Create Source
            Source source = new Source();
            source.Address = queueName;
            source.Capabilities = s;

            void OnAttached(ILink link, Attach attach)
            {
                // Handle the attachment event
                if (attach != null && source.Address != null)
                    Console.WriteLine("Receiver link attached successfully!");
                else
                    Console.WriteLine("Receiver link attachment failed!");
            }

            // Create ReceiverLink
            ReceiverLink receiver = new ReceiverLink(session, "client", source, OnAttached);

            while (true)
            {
                // Get the messages from specific queue
                Message message = receiver.Receive();
                if (message != null)
                {
                    Console.WriteLine("Received " + message.Body.ToString());
                    receiver.Accept(message);
                }

                else
                {
                    Console.WriteLine("No More Messages");
                    break;
                }
            }
            Console.WriteLine("Get Successfull");

            // close the connection
            receiver.Close();
            session.Close();
            connection.Close();
        }

    }
}