import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/website/',
  plugins: [react(), tailwindcss()],
  server: {
    // The deployed site serves both apps from one origin. Mirror that contract
    // when the corporate app is opened directly during local development.
    proxy: {
      '/media': {
        target: process.env.FRONTEND_PROXY || 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
      '/website/e-learning': {
        target: process.env.E_LEARNING_PROXY || 'http://localhost:3002',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/website/, ''),
      },
      '/e-learning': {
        target: process.env.E_LEARNING_PROXY || 'http://localhost:3002',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
