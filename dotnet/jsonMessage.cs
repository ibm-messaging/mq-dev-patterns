/*
* (c) Copyright IBM Corporation 2019
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

using System.Text;

namespace ibmmq_samples
{
    public class JsonMessage
    {
        public string msg;
        public int value;
        public string correlationID;
        private static Random random = new Random();
        private const int CO_ID_LENGTH = 24;

        public JsonMessage(string s)
        {
            msg = s;
            value = random.Next();
            correlationID = correlIdGenerator();
        }

        public string ToJsonString()
        {
            return JsonConvert.SerializeObject(this);
        }

        private static String correlIdGenerator()
        {
            //JMS/XMS is forcing this to generate a 24byte hext string so we need to
            //generate an ASCII string 1 char per byte of length 24 char and converting that into a hex string
            return Guid.NewGuid().ToString().PadRight(CO_ID_LENGTH);
        }

        public static byte[] ToByteArray(string HexString)
        {
            int NumberChars = HexString.Length;
            byte[] bytes = new byte[NumberChars / 2];
            for (int i = 0; i < NumberChars; i += 2)
            {
                bytes[i / 2] = Convert.ToByte(HexString.Substring(i, 2), 16);
            }
            return bytes;
        }

        public static string GetCorrFilter(string s)
        {
            return AsHexString(AsBytes(s)).Replace("-", "")[..(2 * CO_ID_LENGTH)];
        }

        private static string AsHexString(byte[] ba)
        {
            return BitConverter.ToString(ba);
        }

        private static byte[] AsBytes(string s)
        {
            return Encoding.Default.GetBytes(s);
        }
    }

}