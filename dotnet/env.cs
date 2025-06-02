/*
* (c) Copyright IBM Corporation 2019, 2025
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
    class Env
    {
        public class MQEndPoints
        {
            public List<ConnVariables>? mq_endpoints;
        }

        public class ConnVariables
        {
            public string host = null;
            public string qmgr = null;
            public int port = 0;
            public string channel = null;
            public string queue_name = null;
            public string model_queue_name = null;
            public string topic_name = null;
            public string app_user = null;
            public string app_password = null;
            public string cipher_suite = null;
            public string key_repository = null;
            public void dump()
            {
                Console.WriteLine("hostname {0} ", host);
                Console.WriteLine("port {0} ", port);
                Console.WriteLine("qmgr {0} ", qmgr);
                Console.WriteLine("channel {0} ", channel);
                Console.WriteLine("queue {0} ", queue_name);
                Console.WriteLine("topic {0} ", topic_name);
                Console.WriteLine("app_user {0} ", app_user);
                //Console.WriteLine("app_password {0} ", app_password);
                Console.WriteLine("cipherSpec {0} ", cipher_suite);
                Console.WriteLine("sslKeyRepository{0} ", key_repository);
            }
        }

        private MQEndPoints points = null;
        private ConnVariables conn = null;

        internal ConnVariables Conn { get => conn; set => conn = value; }

        private bool AtLeast(int i)
        {
            if (i >= 0 && points != null && points.mq_endpoints != null && points.mq_endpoints.Count >= i)
            {
                return true;
            }
            return false;
        }

        public int NumberOfConnections()
        {
            if (AtLeast(1))
            {
                return points.mq_endpoints.Count;
            }
            return 0;
        }

        private ConnVariables EndPoint(int i)
        {
            if (AtLeast(i))
            {
                return points.mq_endpoints[i];
            }
            return null;
        }

        public IEnumerable<ConnVariables> GetEndpoints()
        {
            int count = NumberOfConnections();
            for (int i = 0; i < count; i++)
            {
                yield return points.mq_endpoints[i];
            }
        }

        public string BuildConnectionString()
        {
            List<string> connList = new List<string>();

            if (AtLeast(1))
            {
                foreach (var c in points.mq_endpoints)
                {
                    if (c.host != null && c.port != 0)
                    {
                        connList.Add(c.host + "(" + c.port.ToString() + ")");
                    }
                }
                return string.Join(",", connList);
            }

            //return "192.168.252.1(1414),192.168.252.1(1416)";
            return "";
        }

        public bool EnvironmentIsSet()
        {
            bool isSet = false;

            try
            {
                Console.WriteLine("Looking for file");
                using (StreamReader r = new StreamReader("env.json"))
                {
                    Console.WriteLine("File found");
                    string json = r.ReadToEnd();

                    points = JsonConvert.DeserializeObject<Env.MQEndPoints>(json);

                    if (points != null && points.mq_endpoints != null && points.mq_endpoints.Count > 0)
                    {
                        Conn = points.mq_endpoints[0];
                        Conn.dump();
                        isSet = true;
                    }
                    else
                    {
                        Console.WriteLine("MQ Settings not found, unable to determine connection variables");
                    }
                    Console.WriteLine("");
                }
                return isSet;
            }
            catch (Exception e)
            {
                Console.WriteLine("Exception caught: {0}", e);
                Console.WriteLine(e.GetBaseException());
                return isSet;
            }

        }

    }
}
