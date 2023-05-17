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

public class AmqpClientAndConnection {

    private String host;
    private int port;
    private String username;
    private String password;

    private AmqpClient client;
    private AmqpConnection connection;

    public AmqpClientAndConnection() {
        if (envSettingsProvided()) {
            this.host = System.getenv("HOST_NAME");
            this.port = Integer.valueOf(System.getenv("PORT"));
            this.username = System.getenv("MQ_USER");
            this.password = System.getenv("PASSWORD");

            // Initialise client and connection.
            client = null;
            connection = null; 
        } else {
            System.out.println("The environment settings were not provided correctly.");
            System.exit(0);
        }
    }

    public void createConnection() {
        System.out.println("Checking to see if there is an existing client: ");
        if (client == null) {
            System.out.println("There is no existing client. Trying to create one. ");
            createClient();
        } else {
            System.out.println("Seems like there is already an existing client.");
            System.out.println("Proceeding to create a connection with the existing client.");
        }

        System.out.println("Trying to create a connection: ");

        // Create the connection
        client.connect(ar -> {
            if (ar.failed()) {
                System.out.println("Unable to connect to the broker");
            } else {
                this.connection = ar.result();
                System.out.println("Created a connection.");
            }
        });

        // Wait max of 15 seconds for the connection to be made.
        waitForConnectionToEstablish();
       
    }

    private void createClient() {
        // Create a client
        AmqpClientOptions options = new AmqpClientOptions()
        .setHost(host)
        .setPort(port)
        .setUsername(username)
        .setPassword(password);
        // Create a client using its own internal Vert.x instance.
        this.client = AmqpClient.create(options);
        System.out.println("Created a client.");
    }

    public AmqpConnection getConnection() {
        return this.connection;
    }

    public void closeClient() {
        if (client != null) {
            System.out.println("\nClosing client...");
            client.close();
        } else {
            System.out.println("There is no client to close.");
        }
    }

    public void closeConnection() {
        if (connection != null) {
            System.out.println("\nClosing connection...");
            connection.close();

            long start = System.nanoTime();

            while (checkIfConnectionIsDisconnected() == false) {
                try {
                    Thread.sleep(100);

                    long end = System.nanoTime();
                    // Waits 15 seconds for the connection to be closed.
                    if ((end - start) > 15000000000L){
                        System.out.println("Connection couldn't be closed.");
                        System.exit(0);
                    }

                } catch(InterruptedException e){
                    System.out.println("Something went wrong.");
                }
            }
            
            System.out.println("Connection closed.");
        } else {
            System.out.println("There is no connection to close. Connection disconnected: " + checkIfConnectionIsDisconnected());
        }
     
    }

    private void waitForConnectionToEstablish() {
       
        long start = System.nanoTime();
        
        while (this.connection == null) {
            try {
                Thread.sleep(100);

                long end = System.nanoTime();
                // Waits 15 seconds for the connection to be made.
                if ((end - start) > 15000000000L){
                    System.out.println("Connection couldn't be made. Check if your broker is running.");
                    System.exit(0);
                }
            } catch(InterruptedException e){
                System.out.println("Something went wrong.");
            }
        }
    }

    public boolean checkIfConnectionIsDisconnected() {
        return this.connection.isDisconnected();
    }

    private boolean envSettingsProvided() {
        System.out.println("Checking if the environment settings were provided correctly.");
        try {
            if (System.getenv("HOST_NAME").isEmpty()) {
                System.out.println("Environment setting \"HOST_NAME\" is not set.");
                return false;
            } else if (System.getenv("PORT").isEmpty()) {
                System.out.println("Environment setting \"PORT\" is not set.");
                return false;
            } else if (System.getenv("MQ_USER").isEmpty()) {
                System.out.println("Environment setting \"MQ_USER\" is not set.");
                return false;
            } else if (System.getenv("PASSWORD").isEmpty()) {
                System.out.println("Environment setting \"PASSWORD\" is not set.");
                return false;
            } else {
                System.out.println("Environment settings are correct.");
                return true;
            }
        } catch (NullPointerException e) {
            return false;
        }
        
    }

}