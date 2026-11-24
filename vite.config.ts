import { defineConfig } from 'vitest/config';

export default defineConfig({
  publicDir: 'assets',
  build: {
    target: 'es2022',
    assetsDir: '_bundle',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'three-vendor';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
});
