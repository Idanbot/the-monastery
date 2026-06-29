import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import packageJson from './package.json';

const apiTarget = process.env.THE_MONASTERY_API_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Analytics is loaded on demand. Keep its chart-heavy chunks out of the
        // install precache, then cache them after the first analytics visit.
        globIgnores: ['**/charts-*.js', '**/AnalyticsView-*.js'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'script',
            handler: 'CacheFirst',
            options: {
              cacheName: 'on-demand-scripts',
              expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          }
        ]
      },
      manifest: {
        name: 'The Monastery',
        short_name: 'Monastery',
        description: 'A focused task board for planning deep work',
        theme_color: '#ffffff',
        icons: []
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/react/') || id.includes('/react-dom/')) return 'react';
          if (id.includes('@react-three') || id.includes('/three/')) return 'three';
          if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/d3/')) return 'charts';
          if (id.includes('@tanstack')) return 'data';
          if (id.includes('@dnd-kit') || id.includes('/cmdk/') || id.includes('react-hook-form')) {
            return 'interaction';
          }
          if (id.includes('/zod/') || id.includes('@hookform/resolvers')) return 'validation';
          if (id.includes('/workbox-')) return 'pwa';
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
    testTimeout: 10000,
    globals: true,
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', 'server-dist/**'],
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 70,
        functions: 65,
        branches: 60,
        statements: 70
      }
    }
  }
});
