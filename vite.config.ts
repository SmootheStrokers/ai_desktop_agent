import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: './apps/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        bubble: resolve(__dirname, 'apps/renderer/bubble.html'),
        panel: resolve(__dirname, 'apps/renderer/panel.html')
      }
    }
  },
  server: {
    port: 3000
  }
});