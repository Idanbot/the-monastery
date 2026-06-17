import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.THE_MONASTERY_API_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/react/') || id.includes('/react-dom/')) return 'react';
          if (
            id.includes('@floating-ui') ||
            id.includes('@radix-ui') ||
            id.includes('class-variance-authority') ||
            id.includes('motion') ||
            id.includes('tailwind-merge')
          ) {
            return 'ui';
          }
          return 'vendor';
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': apiTarget
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', 'server-dist/**'],
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 55,
        functions: 55,
        branches: 45,
        statements: 55
      }
    }
  }
});
