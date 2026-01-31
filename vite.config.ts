import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/GDCAPP/', // Base para GitHub Pages
  resolve: {
    alias: {
      // El alias @ ahora apunta a la raíz del proyecto
      '@': path.resolve(__dirname, './'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
