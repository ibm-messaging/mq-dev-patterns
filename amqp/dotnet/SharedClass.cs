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
/*  FILE NAME:      SharedClass.cs                                                      */
/*                                                                                      */
/*  DESCRIPTION:    A Shared Class with reusable methods namely                         */
/*                  PutMessages() and GetMessages()                                     */
/*  AMQP 1.0 in use. amqpnetlite.core library is used.                                  */
/*  Refer : https://github.com/Azure/amqpnetlite                                        */
/*                                                                                      */
/****************************************************************************************/


namespace ibmmq_amqp_samples
{
    public class SharedClass
	{
        public string hostName = null;
        public string symbolName = null;
        public int port = 0;
        public string Username = null;
        public string Password = null;

        public void PutMessages(string symbolType)
        {
            string add = "amqp://" + Username + ":" + Password + "@" + hostName + ":" + port;
            Address address = new Address(add);

            // Create Connection
            Connection connection = new Connection(address);

            // Create Session
            Session session = new Session(connection);

            // Specifies the endpoint as QUEUE/TOPIC
            Target target = new Target();
            target.Address = symbolName;
            target.Capabilities = new Symbol[]{
                new Symbol(symbolType)
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

            // put/publish the message to specific queue/topic
            sender.Send(message);
            Console.WriteLine("message sent < " + message.Body.ToString() + " >.. ");
            Console.WriteLine("Put/Pub Successfull");

            // close the connection
            sender.Close();
            session.Close();
            connection.Close();
        }

        public void GetMessages(string symbolType)
        {
            string add = "amqp://" + Username + ":" + Password + "@" + hostName + ":" + port;
            Address address = new Address(add);

            // Create Connection
            Connection connection = new Connection(address);

            //Create Session
            Session session = new Session(connection);

            // Specifies the endpoint as QUEUE/TOPIC
            Symbol[] s = new Symbol[]{
                new Symbol(symbolType)
            };
            // Create Source
            Source source = new Source();
            source.Address = symbolName;
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
                // Get the messages from specific queue/topic
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
            Console.WriteLine("Get/Sub Successfull");

            // close the connection
            receiver.Close();
            session.Close();
            connection.Close();
        }
    }
}

