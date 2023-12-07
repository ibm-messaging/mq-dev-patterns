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
/*  FILE NAME:      SimplePut.cs                                                        */
/*                                                                                      */
/*  DESCRIPTION:    A .NET applicaton used to send messages to broker-IBM MQ.           */
/*  AMQP 1.0 in use. amqpnetlite.core library is used.                                  */
/*  Refer : https://github.com/Azure/amqpnetlite                                        */
/*                                                                                      */
/****************************************************************************************/


namespace ibmmq_amqp_samples
{
    class SimplePut
    {
        private Env env = new Env();
        private String hostName = null;
        private String queueName = null;
        private int port = 0;
        private String Username = null;
        private String Password = null;

        public static void Put()
        {
            Console.WriteLine("Start of SimplePut Application\n");

            SimplePut simplePut = new SimplePut();
            if (simplePut.env.EnvironmentIsSet())
            {
                simplePut.hostName = simplePut.env.Conn.host;
                simplePut.port = simplePut.env.Conn.port;
                simplePut.Username = simplePut.env.Conn.app_user;
                simplePut.Password = simplePut.env.Conn.app_password;
                simplePut.queueName = simplePut.env.Conn.queue_name;

                simplePut.PutMessages();
            }

            Console.WriteLine("\nEnd of SimplePut Application\n");
        }

        void PutMessages()
        {
            string add = "amqp://" + Username + ":" + Password + "@" + hostName + ":" + port;
            Address address = new Address(add);

            // Create Connection
            Connection connection = new Connection(address);

            // Create Session
            Session session = new Session(connection);

            // Specify the endpoint as QUEUE
            Target target = new Target();
            target.Address = queueName;
            target.Capabilities = new Symbol[]{
                new Symbol("queue")
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

            // put the message to specific queue
            sender.Send(message);
            Console.WriteLine("message sent < " + message.Body.ToString() + " >.. ");
            Console.WriteLine("Put Successfull");

            // close the connection
            sender.Close();
            session.Close();
            connection.Close();
        }
    }
}