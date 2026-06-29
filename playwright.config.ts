import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'list',
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: [
    {
      command:
        "node -e \"const fs=require('fs');for(const f of ['/tmp/the-monastery-e2e.sqlite','/tmp/the-monastery-e2e.sqlite-shm','/tmp/the-monastery-e2e.sqlite-wal']){try{fs.rmSync(f,{force:true})}catch{}}\" && PORT=3100 HOST=127.0.0.1 THE_MONASTERY_DB_PATH=/tmp/the-monastery-e2e.sqlite THE_MONASTERY_API_RATE_LIMIT_MAX=1000000 npm run dev:api",
      url: 'http://127.0.0.1:3100/api/health',
      reuseExistingServer: false,
      timeout: 120_000
    },
    {
      command: 'THE_MONASTERY_API_URL=http://127.0.0.1:3100 npm run dev -- --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    }
  ]
});
