/****************************************************************************************/
/*                                                                                      */
/*                                                                                      */
/*  Copyright 2025 IBM Corp.                                                            */
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
/*  FILE NAME:      JSON_XML_Serialization.cs                                           */
/*                                                                                      */
/*  DESCRIPTION:    A Shared Class with Serialize and Deserialize methods for           */
/*                  Json and XML Objects                                                */
/*                                                                                      */
/****************************************************************************************/


using IBM.WMQ;
using System.Collections;
using System.Xml.Serialization;
using System.Text.Json;

namespace JSON_XML_Serialization
{
    public class Person
    {
        public string Name { get; set; }
        public int Age { get; set; }
    }

    public class JSON_XML_Serialization
    {
        // Env object to get the Endpoint Values from the JSON
        private static Env env = new Env();
        private static MQQueueManager queueManager;

        static void Main(String[] args)
        {
            try
            {
                string token;
                if (args.Length < 1)
                {
                    Console.WriteLine("Available Operations:");
                    Console.WriteLine("  PutJSON - Serialize an object to JSON and send it to the IBM MQ queue.");
                    Console.WriteLine("  GetJSON - Receive a message from the IBM MQ queue and deserialize it from JSON to an object.");
                    Console.WriteLine("  PutXML  - Serialize an object to XML and send it to the IBM MQ queue.");
                    Console.WriteLine("  GetXML  - Receive a message from the IBM MQ queue and deserialize it from XML to an object.");

                    Console.WriteLine("\nNote: Choices are case-insensitive.");
                }

                else
                {
                    if (env.EnvironmentIsSet())
                    {
                        var connectionProperties = new Hashtable {
                            { MQC.USER_ID_PROPERTY, env.Conn.app_user},
                            { MQC.PASSWORD_PROPERTY, env.Conn.app_password },
                            { MQC.TRANSPORT_PROPERTY, MQC.TRANSPORT_MQSERIES_MANAGED},
                            { MQC.HOST_NAME_PROPERTY, env.Conn.host},
                            { MQC.PORT_PROPERTY, env.Conn.port },
                            { MQC.CHANNEL_PROPERTY, env.Conn.channel }
                        };

                        queueManager = new MQQueueManager("", connectionProperties);
                    }

                    token = args[0].ToLower();
                    switch (token)
                    {
                        case "putjson":
                            JSON_XML_Serialization.PutJSON();
                            break;
                        case "getjson":
                            JSON_XML_Serialization.GetJSON();
                            break;
                        case "putxml":
                            JSON_XML_Serialization.PutXML();
                            break;
                        case "getxml":
                            JSON_XML_Serialization.GetXML();
                            break;
                        default:
                            Console.WriteLine("Choose which operation to perform; PutJSON, GetJSON, PutXML, GetXML");
                            break;
                    }
                }
            }
            catch (MQException E)
            {
                Console.WriteLine("Exception Caught : " + E);
            }
        }

        public static void PutJSON()
        {
            Person person = new Person
            {
                Name = "Alice",
                Age = 28
            };

            string jsonString = JsonSerializer.Serialize(person);

            string queueName = env.Conn.queue_name;

            Console.Write("Accessing queue " + queueName + ".. ");
            var queue = queueManager.AccessQueue(queueName, MQC.MQOO_OUTPUT + MQC.MQOO_FAIL_IF_QUIESCING);
            Console.WriteLine("done");

            var message = new MQMessage();
            message.WriteUTF(jsonString);

            for (int i = 1; i <= 5; i++)
            {
                Console.Write("Message " + i + " - ");
                queue.Put(message);
                Console.WriteLine("put successfully onto the queue");
            }

            queue.Close();
        }

        public static void GetJSON()
        {
            string queueName = env.Conn.queue_name;

            Console.Write("Accessing queue " + queueName + ".. ");
            var queue = queueManager.AccessQueue(queueName, MQC.MQOO_OUTPUT + MQC.MQOO_FAIL_IF_QUIESCING + MQC.MQOO_INPUT_AS_Q_DEF);
            Console.WriteLine("done");

            var message = new MQMessage();

            while (true)
            {
                try
                {
                    queue.Get(message);
                    if (message != null)
                    {
                        //string JsonString = message.ReadString(message.MessageLength / 2);
                        string JsonString = message.ReadUTF();
                        Person deserialized = JsonSerializer.Deserialize<Person>(JsonString);

                        Console.WriteLine($"Name: {deserialized.Name}, Age: {deserialized.Age}");
                    }
                    else
                    {
                        Console.WriteLine("No More Messages");
                        break;
                    }
                }

                catch (MQException MQE)
                {
                    if (MQE.ReasonCode == 2033)
                    {
                        Console.WriteLine("No More Messages");
                        break;
                    }

                    Console.WriteLine("Excpetion Caught : " + MQE);
                    break;
                }

            }

            queue.Close();

        }

        public static void PutXML()
        {
            var person = new Person { Name = "Alice", Age = 30 };
            XmlSerializer serializer = new XmlSerializer(typeof(Person));

            string xmlString;
            using (StringWriter writer = new StringWriter())
            {
                serializer.Serialize(writer, person);
                xmlString = writer.ToString();
            }
            Console.WriteLine("Serialized XML Data : " + xmlString);

            string queueName = env.Conn.queue_name;

            Console.Write("Accessing queue " + queueName + ".. ");
            var queue = queueManager.AccessQueue(queueName, MQC.MQOO_OUTPUT + MQC.MQOO_FAIL_IF_QUIESCING);
            Console.WriteLine("done");

            var message = new MQMessage();
            message.WriteString(xmlString);

            for (int i = 1; i <= 5; i++)
            {
                Console.Write("Message " + i + " - ");
                queue.Put(message);
                Console.WriteLine("put successfully onto the queue");
            }

            queue.Close();
        }

        public static void GetXML()
        {
            string queueName = env.Conn.queue_name;

            Console.Write("Accessing queue " + queueName + ".. ");
            var queue = queueManager.AccessQueue(queueName, MQC.MQOO_OUTPUT + MQC.MQOO_FAIL_IF_QUIESCING + MQC.MQOO_INPUT_AS_Q_DEF);
            Console.WriteLine("done");

            var message = new MQMessage();
            XmlSerializer serializer = new XmlSerializer(typeof(Person));
            Person deserialized;
            string xmlString;

            while (true)
            {
                try
                {
                    queue.Get(message);
                    if (message != null)
                    {
                        xmlString = message.ReadString(message.MessageLength / 2);
                        Console.WriteLine("XML String : " + xmlString);
                        using (StringReader reader = new StringReader(xmlString))
                        {
                            deserialized = (Person)serializer.Deserialize(reader);
                        }

                        Console.WriteLine("\nDeserialized object:");
                        Console.WriteLine($"Name = {deserialized.Name}, Age = {deserialized.Age}");
                    }
                    else
                    {
                        Console.WriteLine("No More Messages");
                        break;
                    }
                }

                catch(MQException MQE)
                {
                    if (MQE.ReasonCode == 2033)
                    {
                        Console.WriteLine("No More Messages");
                        break;
                    }

                    Console.WriteLine("Excpetion Caught : " + MQE);
                    break;
                }
                
            }

            queue.Close();
        }
    }
}