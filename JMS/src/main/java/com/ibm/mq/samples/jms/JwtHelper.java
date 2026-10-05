/*
 * (c) Copyright IBM Corporation 2024
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
import java.util.logging.Level;
import java.util.logging.Logger;

import org.json.JSONObject;

public class JwtHelper {
  private static final Logger logger = LoggingHelper.getLogger(JwtHelper.class.getName());
  private String tokenEndpoint = "";
  private String tokenUsername = "";
  private String tokenPassword = "";
  private String tokenClientId = "";

  public JwtHelper(EnvSetter env) {
    tokenEndpoint = env.getJwtEnv("JWT_TOKEN_ENDPOINT");
    tokenUsername = env.getJwtEnv("JWT_TOKEN_USERNAME");
    tokenPassword = env.getJwtEnv("JWT_TOKEN_PWD");
    tokenClientId = env.getJwtEnv("JWT_TOKEN_CLIENTID");
  }


  public String obtainToken() {
    String access_token = "";

    //build the string with parameters provided as environment variables, to include in the POST request to the token issuer
    String postBuild = String.format("client_id=%s&username=%s&password=%s&grant_type=password",tokenClientId, tokenUsername, tokenPassword);

    HttpClient client = HttpClient.newHttpClient();

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(
            //            "<keycloak URL>/realms/master/protocol/openid-connect/token"
            tokenEndpoint
            ))
        .POST(
            BodyPublishers.ofString(postBuild))
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

    if ((tokenEndpoint == null || tokenEndpoint.trim().isEmpty()) ||
        (tokenUsername == null || tokenUsername.trim().isEmpty()) ||
        (tokenPassword == null || tokenPassword.trim().isEmpty()) ||
        (tokenClientId == null || tokenClientId.trim().isEmpty())) {
      return false;
    }

    return true;
  }
}
