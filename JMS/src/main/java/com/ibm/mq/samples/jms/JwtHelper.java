/*
 * (c) Copyright IBM Corporation 2024, 2026
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
package com.ibm.mq.samples.jms;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import org.json.JSONObject;

/*
 * Read the configuration for JWT-related attributes. Use them to get an access token.
 *
 * The connection to the token server (eg a local Keycloak instance) is configured to use TLS
 * but not to validate the server's certificate. That is OK for a development example, but do not
 * carry that forward into real applications.
 */
public class JwtHelper {
  private static final Logger logger = LoggingHelper.getLogger(JwtHelper.class.getName());
  private String tokenEndpoint = "";
  private String tokenUsername = "";
  private String tokenPassword = "";
  private String tokenClientId = "";
  private String tokenClientSecret = "";

  public JwtHelper(EnvSetter env) {
    tokenEndpoint = env.getJwtEnv("JWT_TOKEN_ENDPOINT");
    tokenUsername = env.getJwtEnv("JWT_TOKEN_USERNAME");
    tokenPassword = env.getJwtEnv("JWT_TOKEN_PWD");
    tokenClientId = env.getJwtEnv("JWT_TOKEN_CLIENTID");
    tokenClientSecret = env.getJwtEnv("JWT_TOKEN_CLIENTSECRET");
  }

  public String obtainToken() {
    String access_token = "";
    String postBuild = "";;

    /*
      Build the POST string with parameters from the configuration. There are two formats if request, one
      based on clientSecret values, and one (deprecated) based on username/password values. In both cases, the
      token we are looking to obtain is indicated by the "grant_type=password" element.

      These curl commands are the base of the call to get a token. It uses form data to
      set the various parameters. The 2nd format is now preferred.

      curl -k -X POST "https://$host:$port/realms/$realm/protocol/openid-connect/token" \
         -H "Content-Type: application/x-www-form-urlencoded" \
         -d "username=$user" -d "password=$password" \
         -d "grant_type=password" -d "client_id=$cid"


      curl -k -X POST "https://$host:$port/realms/$realm/protocol/openid-connect/token" \
         -H "Content-Type: application/x-www-form-urlencoded" \
         -d "client_secret=$secret" \
         -d "grant_type=client_credentials" -d "client_id=$cid"

      WARNING: This sample uses TLS but disables server certificate validation.
      This is intentional for a dev/test environment where the token endpoint
      (e.g. a local Keycloak instance) does not have a trusted certificate.
      DO NOT use this approach in production — always validate the server certificate
      in production deployments.
     */

    if (isNullOrEmpty(tokenClientSecret)) {
      postBuild = String.format("client_id=%s&username=%s&password=%s&grant_type=password",tokenClientId, tokenUsername, tokenPassword);
    } else {
      postBuild = String.format("client_id=%s&client_secret=%s&grant_type=password",tokenClientId, tokenClientSecret);
    }

    HttpClient client;
    try {
      // Trust-all SSLContext — dev/test only, not for production use.
      TrustManager[] trustAllCerts = new TrustManager[] {
          new X509TrustManager() {
            @Override
            public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
            @Override
            public void checkClientTrusted(X509Certificate[] certs, String authType) {}
            @Override
            public void checkServerTrusted(X509Certificate[] certs, String authType) {}
          }
      };
      SSLContext sslContext = SSLContext.getInstance("TLS");
      sslContext.init(null, trustAllCerts, new SecureRandom());
      client = HttpClient.newBuilder()
          .sslContext(sslContext)
          .build();
    } catch (NoSuchAlgorithmException | KeyManagementException e) {
      JmsExceptionHelper.recordFailure(logger, e);
      return access_token;
    }

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(tokenEndpoint))
        .POST(BodyPublishers.ofString(postBuild))
        .setHeader("Content-Type", "application/x-www-form-urlencoded")
        .build();
    logger.log(Level.INFO, "Obtaining token from: {0}", tokenEndpoint);

    try {
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

      JSONObject myJsonObject = new JSONObject(response.body());
      access_token = myJsonObject.getString("access_token");
      logger.log(Level.INFO, "Using token: {0}", access_token);
    } catch (Exception e) {
      JmsExceptionHelper.recordFailure(logger,e);
    }
    return access_token;
  }

  public boolean isJwtEnabled() {

    if (isNullOrEmpty(tokenEndpoint) ||
        isNullOrEmpty(tokenClientId)) {
      return false;
    }

    // Can set either the secret or the username/password
    if (isNullOrEmpty(tokenClientSecret)) {
      if (isNullOrEmpty(tokenUsername) || isNullOrEmpty(tokenPassword)) {
        return false;
      }
    }

    return true;
  }

  private boolean isNullOrEmpty(String s) {
    if (s != null && !s.isEmpty()) {
      return false;
    } else {
      return true;
    }
  }
}
