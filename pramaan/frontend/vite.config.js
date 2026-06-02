import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The single shared .env lives in the project root, one level up from frontend/.
// `envDir` makes Vite load it for `import.meta.env`; only VITE_-prefixed vars are
// exposed to client code (backend secrets in the same file are never bundled).
const envDir = path.resolve(__dirname, '..');

export default defineConfig(({ mode }) => {
  // Load ALL vars (empty prefix) for use INSIDE this config only — e.g. the
  // backend PORT for the dev proxy. This object is never exposed to client code;
  // client exposure is still governed by Vite's default VITE_ prefix.
  const env = loadEnv(mode, envDir, '');

  const devPort = Number(env.VITE_DEV_PORT) || 5173;
  const backendPort = Number(env.PORT) || 3001;
  // In dev, proxy the same relative `/api` path the app uses in production to the
  // local backend, so there is no CORS and dev mirrors the single-server deploy.
  const proxyTarget = env.VITE_API_PROXY_TARGET || `http://localhost:${backendPort}`;

  const proxy = { '/api': { target: proxyTarget, changeOrigin: true } };

  return {
    plugins: [react()],
    envDir,
    server: { port: devPort, proxy },
    preview: { port: devPort, proxy },
  };
});
