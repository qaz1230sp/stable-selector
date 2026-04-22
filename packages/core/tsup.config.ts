import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
  },
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'StableSelector',
    dts: false,
    clean: false,
    sourcemap: true,
    treeshake: true,
    minify: true,
    target: 'es2020',
    outDir: 'dist',
    outExtension: () => ({ js: '.global.js' }),
  },
]);
