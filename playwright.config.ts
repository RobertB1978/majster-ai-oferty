import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run sequentially in CI for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['line'], ['html']],
  timeout: 180000, // 3 minutes per test (increased for CI)
  globalTimeout: process.env.CI ? 10 * 60 * 1000 : 5 * 60 * 1000,
  outputDir: 'test-results',

  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:8080',
    trace: 'on-first-retry',
    screenshot: 'on-first-retry',
    video: 'on-first-retry',
    actionTimeout: 45000, // 45s for each action (increased for CI)
    navigationTimeout: 90000, // 90s for navigation (increased for CI)
    expect: {
      timeout: process.env.CI ? 10000 : 5000,
    },
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
    command: 'npm run dev -- --host 127.0.0.1 --port 8080 --strictPort',
    port: 8080, // CRITICAL: Use 'port' not 'url' - faster and more reliable in CI
    reuseExistingServer: true,
    timeout: process.env.CI ? 120000 : 300000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Global setup - ensures server is ready and React hydrated
  globalSetup: './e2e/global-setup.ts',
});
