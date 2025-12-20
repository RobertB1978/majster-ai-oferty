import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run sequentially in CI for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 5 : 0, // More retries in CI (increased from 3)
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [
        ['line'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ],
  timeout: 180000, // 3 minutes per test (increased for CI)
  globalTimeout: process.env.CI ? 30 * 60 * 1000 : undefined, // 30 minutes max in CI
  outputDir: 'playwright-test-results',
  expect: {
    timeout: process.env.CI ? 15000 : 5000,
  },

  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:8080',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 45000, // 45s for each action (increased for CI)
    navigationTimeout: 90000, // 90s for navigation (increased for CI)
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
  ],

  webServer: {
    command: 'npm run dev -- --host 0.0.0.0 --port 8080 --strictPort --clearScreen false',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 300000, // 5 minutes to start server (increased for CI)
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Global setup - ensures server is ready and React hydrated
  globalSetup: './e2e/global-setup.ts',
});
