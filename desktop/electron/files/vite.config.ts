/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { buildContentSecurityPolicy } from './config/csp';

// Production CSP. Dev skips it because Vite's HMR client needs inline scripts and a websocket.
// VITE_API_BASE_URL (from .env or the shell), when set, adds the API origin to connect-src.
const contentSecurityPolicy = (apiBaseUrl: string | undefined): Plugin => ({
  name: 'content-security-policy',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: {
        'http-equiv': 'Content-Security-Policy',
        content: buildContentSecurityPolicy(apiBaseUrl),
      },
      injectTo: 'head-prepend',
    },
  ],
});

export default defineConfig(({ mode }) => ({
  plugins: [react(), contentSecurityPolicy(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_BASE_URL)],
  // Relative asset URLs so dist/index.html works when Electron loads it from file://
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5180,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'electron/**/*.test.ts', 'config/**/*.test.ts'],
  },
}));
