/*
* (c) Copyright IBM Corporation 2023
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

package vertxtutorial;

import java.io.IOException;
import io.vertx.amqp.*;

public class Runner {
    
    public static void main(String[] args) {

        AmqpClientAndConnection clientAndConnection = new AmqpClientAndConnection();

        // Create a connection
        clientAndConnection.createConnection();

        Receiver receiver = new Receiver();
        // Create a receiver 
        receiver.createReceiver(clientAndConnection);

        // Closing connection after catching Control + C from user
        Runtime.getRuntime().addShutdownHook(new Thread()
        {
            @Override
            public void run()
            {
               clientAndConnection.closeConnection();
            }
        });

    }
    
}
