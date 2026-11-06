import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: '127.0.0.1', port: 9000, strictPort: true },
  build: { chunkSizeWarningLimit: 2000 },
});
