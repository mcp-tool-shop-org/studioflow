import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@studioflow/domain': resolve(__dirname, 'packages/domain/src/index.ts'),
      '@studioflow/state': resolve(__dirname, 'packages/state/src/index.ts'),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts', 'apps/*/src/**/*.test.ts', 'apps/*/src/**/*.test.tsx'],
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
});
