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
/*  FILE NAME:      AMQPSamples.cs                                                      */
/*                                                                                      */
/*  DESCRIPTION:  User can choose which program to be ran through arguments             */
/*                                                                                      */
/*  example : put (runs the SimplePut Application)                                      */
/*  Similarly :                                                                         */
/*  get (runs the SimpleGut Application)                                                */
/*  pub (runs the SimplePub Application)                                                */
/*  sub (runs the SimpleSub Application)                                                */
/*                                                                                      */
/****************************************************************************************/


using ibmmq_amqp_samples;

string token;
if (args.Length < 1)
{
    Console.WriteLine("Say which program you want to run; put, get, pub, sub");
}

else
{
    token = args[0].ToLower();
    Console.WriteLine(token);
    switch (token)
    {
        case "put":
            SimplePut.Put();
            break;
        case "get":
            SimpleGet.Get();
            break;
        case "sub":
            SimpleSub.Sub();
            break;
        case "pub":
            SimplePub.Pub();
            break;
        default:
            Console.WriteLine("Say which program you want to run; put, get, pub, sub");
            break;
    }
}