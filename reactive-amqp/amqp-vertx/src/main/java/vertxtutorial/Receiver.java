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

import io.vertx.amqp.*;

public class Receiver {

    private AmqpReceiver receiver;

    public void createReceiver(AmqpClientAndConnection clientAndConnection){
        clientAndConnection.getConnection().createReceiver("myreceiver",
            done -> {
                if (done.failed()) {
                    System.out.println("Unable to create receiver");
                    clientAndConnection.closeConnection();
                } else {
                    this.receiver = done.result();
                    receiver.handler(msg -> {
                        // Called on every received message
                        System.out.println("Received the message: " + msg.bodyAsString());
                    });
                }
            }
        );
        
        // Wait max of 15 seconds for the connection to be made.
        waitForReceiverToEstablish();

    }

    public AmqpReceiver getReceiver() {
        return this.receiver;
    }

    private void waitForReceiverToEstablish() {

        long start = System.nanoTime();

        while (this.receiver == null) {
            try {
                Thread.sleep(100);
                if (this.receiver != null) System.out.println("Receiver address: " + (this.receiver.address()));

                long end = System.nanoTime();
                // Waits 15 seconds for the receiver to be ready.
                if ((end - start) > 15000000000L){
                    System.out.println("Receiver couldn't be created. Try rerunning the broker.");
                    System.exit(0);
                }

            } catch(InterruptedException e){
                System.out.println("Something went wrong.");
            } catch(NullPointerException e){
                System.out.println("Caught NullPointerException. \nThe receiver might not have been created. Try rerunning the application.");
            }
        }
    }

}