/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite configuration for the DiagramForge editor.
 * - React 19 + Fast Refresh
 * - Tailwind CSS 4 via the official plugin
 * - `@` path alias mapped to `src`
 * - Vitest configured for jsdom + RTL
 * - GitHub Pages: set GITHUB_PAGES=true (base path /Udraw/)
 */
const githubPages = process.env.GITHUB_PAGES === 'true';
const pagesBase = process.env.VITE_BASE_PATH ?? (githubPages ? '/Udraw/' : '/');

export default defineConfig({
  base: pagesBase,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'DiagramForge',
        short_name: 'DiagramForge',
        description: 'Offline-first diagram editor — a draw.io alternative.',
        theme_color: '#6366f1',
        background_color: '#0f1117',
        display: 'standalone',
        start_url: githubPages ? `${pagesBase}` : '.',
        icons: [
          {
            src: `${pagesBase}favicon.svg`,
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
        navigateFallback: `${pagesBase}index.html`,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
});
