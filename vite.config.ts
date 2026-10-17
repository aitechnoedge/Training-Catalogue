import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import express from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'path';
import {defineConfig} from 'vite';

const eLearningRoot = path.resolve(__dirname, 'apps/e-learning');

const eLearningAssets = () => ({
  name: 'technoedge-e-learning-assets',
  enforce: 'pre' as const,
  configureServer(server: { middlewares: { use: (...args: unknown[]) => void } }) {
    const staticOptions = { fallthrough: true, index: false, redirect: false };
    server.middlewares.use((request: IncomingMessage, response: ServerResponse, next: () => void) => {
      if ((request.method === 'GET' || request.method === 'HEAD') && /^\/(?:\?.*)?$/.test(request.url || '')) {
        response.statusCode = 302;
        response.setHeader('Location', '/website/');
        response.end();
        return;
      }
      next();
    });
    server.middlewares.use('/media', express.static(path.join(eLearningRoot, 'public/media'), staticOptions));
    server.middlewares.use('/images', express.static(path.join(eLearningRoot, 'public/images'), staticOptions));
    server.middlewares.use(
      '/src/assets/images',
      express.static(path.join(eLearningRoot, 'src/assets/images'), staticOptions),
    );
  },
});

export default defineConfig(() => {
  return {
    plugins: [eLearningAssets(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // Workspace builds replace files under dist; watching them can crash
      // Windows FSWatcher while the dev server is running.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/dist/**'],
      },
      proxy: {
        '/website': {
          target: process.env.WEBSITE_PROXY || 'http://localhost:3003',
          changeOrigin: true,
          ws: true,
        },
        '/e-learning': {
          target: process.env.E_LEARNING_PROXY || 'http://localhost:3002',
          changeOrigin: true,
          ws: true,
        },
        '/api': {
          target: process.env.CATALOGUE_API_PROXY || 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
