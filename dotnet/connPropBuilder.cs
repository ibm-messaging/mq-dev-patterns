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
    class ConnectionPropertyBuilder
    {
        private const string CCDT = "MQCCDTURL";
        private const string FILEPREFIX = "file://";
        static public void SetConnectionProperties(IConnectionFactory cf, Env env)
        {
            Env.ConnVariables conn = env.Conn;

            string ccdtURL = CheckForCCDT();
            if (null != ccdtURL)
            {
                Console.WriteLine("CCDT Environment setting found");
                cf.SetStringProperty(XMSC.WMQ_CCDTURL, ccdtURL);
            }
            else
            {
                if (env.NumberOfConnections() > 1)
                {
                    Console.WriteLine("There are {0} connections", env.NumberOfConnections());
                    cf.SetStringProperty(XMSC.WMQ_CONNECTION_NAME_LIST, env.BuildConnectionString());
                    Console.WriteLine("Connection string is {0}", env.BuildConnectionString());
                }
                else
                {
                    cf.SetStringProperty(XMSC.WMQ_HOST_NAME, conn.host);
                    Console.WriteLine("hostName is set {0, -20 }", conn.host);
                    cf.SetIntProperty(XMSC.WMQ_PORT, conn.port);
                }
                cf.SetStringProperty(XMSC.WMQ_CHANNEL, conn.channel);
            }
            SetRemConnectionProperties(cf, conn);
        }

        static public void SetConnectionProperties(IConnectionFactory cf, Env.ConnVariables conn)
        {
            string ccdtURL = CheckForCCDT();
            if (null != ccdtURL)
            {
                Console.WriteLine("CCDT Environment setting found");
                cf.SetStringProperty(XMSC.WMQ_CCDTURL, ccdtURL);
            }
            else
            {
                cf.SetStringProperty(XMSC.WMQ_HOST_NAME, conn.host);
                Console.WriteLine("hostName is set {0, -20 }", conn.host);
                cf.SetIntProperty(XMSC.WMQ_PORT, conn.port);
                cf.SetStringProperty(XMSC.WMQ_CHANNEL, conn.channel);
            }
            SetRemConnectionProperties(cf, conn);
        }

        static private void SetRemConnectionProperties(IConnectionFactory cf, Env.ConnVariables conn)
        {
            cf.SetIntProperty(XMSC.WMQ_CONNECTION_MODE, conn.is_managed ? XMSC.WMQ_CM_CLIENT : XMSC.WMQ_CM_CLIENT_UNMANAGED);
            cf.SetStringProperty(XMSC.WMQ_QUEUE_MANAGER, conn.qmgr);
            cf.SetStringProperty(XMSC.USERID, conn.app_user);
            cf.SetStringProperty(XMSC.PASSWORD, conn.app_password);

            Console.WriteLine("Connection Cipher is set to {0}", conn.cipher_suite);
            Console.WriteLine("Key Repository is set to {0}", conn.key_repository);

            if (conn.key_repository != null && conn.cipher_suite != null)
            {
                cf.SetStringProperty(XMSC.WMQ_SSL_KEY_REPOSITORY, conn.key_repository);
            }
            if (conn.cipher_suite != null)
            {
                cf.SetStringProperty(XMSC.WMQ_SSL_CIPHER_SPEC, conn.cipher_suite);
            }
        }

        static private string CheckForCCDT()
        {
            Console.WriteLine("Checking for CCDT File");
            string ccdt = Environment.GetEnvironmentVariable(CCDT);

            if (null != ccdt)
            {
                Console.WriteLine("{0} environment variable is set to {1}", CCDT, ccdt);
                Console.WriteLine("Will be checking for {0}", ccdt.Replace(FILEPREFIX, ""));
                if (File.Exists(ccdt.Replace(FILEPREFIX, "")))
                {
                    Console.WriteLine("CCDT file found");
                    return ccdt;
                }
            }

            Console.WriteLine("No CCDT file found or specified");
            return null;
        }

    }
}