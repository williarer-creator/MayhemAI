import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  server: {
    port: 5174, // Different port from 3DMayhem (5173)
  },
  optimizeDeps: {
    exclude: ['opencascade.js'],
  },
  build: {
    target: 'esnext',
  },
});
