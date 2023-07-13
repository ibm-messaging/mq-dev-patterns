/**
 * Copyright 2022, 2023 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
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
 **/

const { createProxyMiddleware } = require('http-proxy-middleware');

const be = process.env.REACT_APP_BE_HOST;
const be_port = process.env.REACT_APP_BE_PORT || "8080";
const be_tls = process.env.REACT_APP_BE_TLS || false;
const HTTP_PROTOCOL = be_tls ? "https://" : "http://";

const be_host = HTTP_PROTOCOL + be + ":" + be_port;

module.exports = function(app) {        
    app.use(
      '/api',
      createProxyMiddleware({
        target: String(be_host),
        changeOrigin: true,
        headers: { Connection: 'keep-alive' }
      })
    );
};
 
 