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

import path from 'node:path';
import { type SassPreprocessorOptions, defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Coding challenge flag: the process env (Docker build arg) wins, then the
  // root .env. Anything other than "true" means off.
  const rootEnv = loadEnv(mode, path.resolve(process.cwd(), '../..'), '');
  const codingChallenge =
    String(
      process.env.REACT_APP_IS_FOR_CODING_CHALLENGE ??
        rootEnv.REACT_APP_IS_FOR_CODING_CHALLENGE ??
        ''
    )
      .trim()
      .toLowerCase() === 'true'
      ? 'true'
      : 'false';

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
        // 'api' is a Vite-internal option not yet reflected in SassPreprocessorOptions types
        scss: { api: 'modern-compiler' } as SassPreprocessorOptions,
      },
    },
    // process.env shim for Carbon/legacy deps; coding challenge flag listed
    // explicitly so Vite inlines the real build-time value.
    define: {
      'process.env': {},
      'process.env.REACT_APP_IS_FOR_CODING_CHALLENGE':
        JSON.stringify(codingChallenge),
    },
  };
});
