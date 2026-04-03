import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/upload': 'http://localhost:3001',
      '/analyze': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/report': 'http://localhost:3001',
    },
  },
});
