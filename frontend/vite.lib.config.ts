/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

/**
 * Library build — produces `@diagramforge/react` for embedding in other apps.
 *
 *   npm run build:lib
 *
 * Outputs:
 *   dist/diagramforge.js       (ESM)
 *   dist/diagramforge.umd.cjs  (UMD)
 *   dist/diagramforge.css      (required styles)
 *   dist/lib/index.d.ts        (TypeScript declarations)
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      include: ['src/lib/**/*.ts', 'src/lib/**/*.tsx'],
      outDir: 'dist',
      entryRoot: 'src/lib',
      rollupTypes: true,
      tsconfigPath: './tsconfig.lib.json',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      name: 'DiagramForge',
      formats: ['es', 'umd'],
      fileName: (format) => (format === 'es' ? 'diagramforge.js' : 'diagramforge.umd.cjs'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        inlineDynamicImports: true,
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
        assetFileNames: 'diagramforge.css',
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    emptyOutDir: true,
  },
});
