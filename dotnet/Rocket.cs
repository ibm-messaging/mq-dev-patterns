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

using ibmmq_samples;

string token;
if (args.Length < 1)
{
    Console.WriteLine("Say which program you want to run; put, get, pub, sub, request, response");
}
else
{
    token = args[0];
    Console.WriteLine(token);
    switch (token)
    {
        case "put":
            SimpleProducer.Put();
            break;
        case "get":
            SimpleConsumer.Get();
            break;
        case "sub":
            SimpleSubscriber.Sub();
            break;
        case "pub":
            SimplePublisher.Pub();
            break;
        case "request":
            SimpleRequest.Request();
            break;
        case "response":
            SimpleResponse.Response();
            break;
        default:
            Console.WriteLine("Say which program you want to run; put, get, pub, sub, request, response");
            break;
    }
}