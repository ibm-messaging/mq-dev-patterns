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
/*  FILE NAME:      SimpleSub.cs                                                        */
/*                                                                                      */
/*  DESCRIPTION:    A .NET applicaton used to subscribe for messages to broker-IBM MQ.  */
/*  AMQP 1.0 in use. amqpnetlite.core library is used.                                  */
/*  Refer : https://github.com/Azure/amqpnetlite                                        */
/*                                                                                      */
/****************************************************************************************/


namespace ibmmq_amqp_samples
{
    class SimpleSub
    {
        private static Env env = new Env();

        public static void Sub()
        {
            Console.WriteLine("Start of SimpleSub Application\n");

            SharedClass sharedClass = new SharedClass();
            if (env.EnvironmentIsSet())
            {
                sharedClass.hostName = env.Conn.host;
                sharedClass.port = env.Conn.port;
                sharedClass.Username = env.Conn.app_user;
                sharedClass.Password = env.Conn.app_password;
                sharedClass.symbolName = env.Conn.topic_name;

                sharedClass.Consume("topic");
            }

            Console.WriteLine("\nEnd of SimpleSub Application\n");
        }
    }
}
