# Steps to connect a Sample Application to an IBM MQ Queue Manager using JWT with JWKS 

*coming soon* You can find a more in-depth step-by-step tutorial on IBM Developer(https://developer.ibm.com/components/ibm-mq/tutorials/).

## 1. Set up a keycloak server in a container 

• Open up a terminal and create a keystore using openssl, for your keycloak server (token issuer).

``` mkdir keycloakKeystore ```

``` openssl req -newkey rsa:2048 -nodes -keyout keycloakKeystore/keycloakPrivate.pem -x509 -days 365 -out keycloakKeystore/keycloakPublic.pem -subj "/C=GB/ST=MYSTATE/L=MYCITY/O=MYORG, Inc./OU=IT/CN=<hostname>" -addext "subjectAltName=DNS:<hostname>,IP:127.0.0.1" ```

``` openssl pkcs12 -inkey keycloakKeystore/keycloakPrivate.pem -in keycloakKeystore/keycloakPublic.pem -export -out keycloakKeystore/keycloak.p12 ```

``` chmod 770 keycloakKeystore && chmod 440 keycloakKeystore/keycloak.p12 ```

• Then, you can start your keycloak server.

```podman run -p 32030:32030 -e KEYCLOAK_ADMIN=kcadmin -e KEYCLOAK_ADMIN_PASSWORD=passw0rd -v /path/to/keycloakKeystore/:/path/to/keycloakKeystore/   quay.io/keycloak/keycloak:latest start --hostname-strict=false --https-key-store-file=/path/to/keycloakKeystore/keycloak.p12 --https-key-store-password=password --https-port=32030 ```

• Open up a web browser, and go to your JWKS endpoint (https://<hostname>:32030/). 

• Sign in using your admin credentials (that you set up when starting your keycloak server - hint: check the previous run command).

• Once logged in, go to: `clients` > `admin-cli` > `advanced` > `advanced settings` > turn the `lightweight token` off

• Now, go to: `Users` > `Add user` > call your user "app" > `create` > `credentials` > set a password > turn `Temporary` off 


## 2. Configure your queue manager to accept authentication via JWKS

• Firstly, ensure you have a queue manager running in a container.

• The configuration for your queue manager along with the samples can be found in this repo.

```git clone https://github.com/ibm-messaging/mq-dev-patterns.git ```

• You can find the queue manager configuration in this directory [queue manager config](qm.ini)

• The JWKS stanza in this file needs to be edited appropriately, either in an editor or terminal.

• Now you can copy this file back into your queue manager along with the keycloak server’s public certificate:

``` podman cp qm.ini QM1:/var/mqm/qmgrs/QM1/ ```

``` podman cp keycloakKeystore/keycloakPublic.pem QM1:/var/mqm/qmgrs/QM1/ssl/ ```

• Next, we will need command line access inside the queue manager to create your queue manager’s keystore and import the keycloak public key.

``` podman exec -ti QM1 bash```

``` opt/mqm/bin/runmqakm -keydb -create -db /var/mqm/qmgrs/QM1/ssl/mqdefcer.p12 -pw password -type pkcs12 -stash ```

``` runmqakm -cert -add -db /var/mqm/qmgrs/QM1/ssl/mqdefcer.p12 -pw password -label keycloakPublicLabel -file /var/mqm/qmgrs/QM1/ssl/keycloakPublic.pem ```

• Refresh security inside the Queue Manager so that it can recognise the JWKS endpoint and read the keystore

```runmqsc```
```REFRESH SECURITY```

## 3. Configure and run client

• Your samples need to connect to the keycloak server, to do so they will need their own keystore. The keycloak's public certificate will need to be imported into this keystore.

### JMS 

• If you want to run our JMS samples, create your Java keystore and import the keycloak public key.

``` keytool -importcert -file keycloakKeystore/keycloakPublic.pem -keystore clientkey.jks -alias "jmsClientHttps " ```

• Edit the env.json, so that it has a single MQ endpoint and the JWT issuer config block has the appropriate values. The username and password here are the"app" user credentials you would have set up earlier, via the keycloak console.

• Then, you can build and run your client!

``` cd JMS ```

``` mvn clean package ```

```java -Djavax.net.ssl.trustStore=/path/to/clientkey.jks -Djavax.net.ssl.trustStorePassword=password  -cp target/mq-dev-patterns-0.1.0.jar com.ibm.mq.samples.jms.JmsPut ```