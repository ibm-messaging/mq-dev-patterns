/**
 * Copyright 2026 IBM Corp.
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

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const be = env.VITE_BE_HOST;
  const be_port = env.VITE_BE_PORT;
  const be_tls = env.VITE_BE_TLS;
  const HTTP_PROTOCOL = be_tls ? 'https://' : 'http://';
  const be_host = be
    ? `${HTTP_PROTOCOL}${be}:${be_port}`
    : 'http://localhost:8000';

  return {
    plugins: [react()],
    server: {
      open: false,
      proxy: {
        '/api': {
          target: be_host,
          changeOrigin: true,
          headers: { Connection: 'keep-alive' },
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
    // Some Carbon internals and older transitive deps still reference process.env
    define: {
      'process.env': {},
    },
  };
});
