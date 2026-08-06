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
